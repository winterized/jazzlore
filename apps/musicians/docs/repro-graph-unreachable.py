#!/usr/bin/env python3
"""Reproduce the intermittent 'graph unreachable' failure on the musicians BFF.

Hits the live detail endpoint for Miles Davis (high-degree) and Thelonious Monk
repeatedly, sequentially and concurrently, recording HTTP status, timing, the
worker error envelope, and Cloudflare diagnostic headers. Read-only.
"""
import concurrent.futures as cf
import json
import time
import urllib.request
import urllib.error
from collections import Counter

BASE = "https://musicians.jazzlore.com"
TARGETS = {
    "miles": "wikidata:Q93341",
    "monk": "wikidata:Q109612",
}
HDR = {"Accept": "application/json", "User-Agent": "jazzlore-repro/1.0"}


_seq = 0


def hit(mid):
    global _seq
    _seq += 1
    # Unique query string per request → edge cache MISS → exercise the worker
    # origin (worker->Aura). The worker routes on pathname only, so ?cb is inert
    # to routing but forces the CDN to skip its 1.5h cached 200.
    url = f"{BASE}/api/musicians/{urllib.parse.quote(mid, safe='')}?cb={int(time.time()*1000)}_{_seq}"
    t0 = time.time()
    try:
        req = urllib.request.Request(url, headers=HDR)
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read(400).decode("utf-8", "replace")
            return {
                "status": r.status,
                "ms": round((time.time() - t0) * 1000),
                "cf_ray": r.headers.get("cf-ray"),
                "cf_cache": r.headers.get("cf-cache-status"),
                "age": r.headers.get("age"),
                "server": r.headers.get("server"),
                "body": body[:200],
            }
    except urllib.error.HTTPError as e:
        body = e.read(400).decode("utf-8", "replace")
        return {
            "status": e.code,
            "ms": round((time.time() - t0) * 1000),
            "cf_ray": e.headers.get("cf-ray"),
            "cf_cache": e.headers.get("cf-cache-status"),
            "server": e.headers.get("server"),
            "body": body[:200],
        }
    except Exception as e:
        return {
            "status": "EXC",
            "ms": round((time.time() - t0) * 1000),
            "error": f"{type(e).__name__}: {e}",
        }


def run_sequential(name, mid, n):
    print(f"\n=== SEQUENTIAL {name} ({mid}) x{n} ===", flush=True)
    statuses, times = Counter(), []
    for i in range(n):
        r = hit(mid)
        statuses[r["status"]] += 1
        times.append(r["ms"])
        flag = "" if r["status"] == 200 else "  <<< FAIL"
        print(
            f"[{name} {i+1:02d}] {r['status']} {r['ms']:>6}ms "
            f"ray={r.get('cf_ray')} cache={r.get('cf_cache')} "
            f"age={r.get('age')} body={r.get('body', r.get('error',''))[:120]}{flag}",
            flush=True,
        )
    times.sort()
    print(
        f"--- {name} summary: {dict(statuses)} | "
        f"min={times[0]} p50={times[len(times)//2]} max={times[-1]}ms ---",
        flush=True,
    )
    return statuses


def run_concurrent(name, mid, n, workers):
    print(f"\n=== CONCURRENT {name} ({mid}) x{n} workers={workers} ===", flush=True)
    statuses = Counter()
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        results = list(ex.map(lambda _: hit(mid), range(n)))
    for i, r in enumerate(results):
        statuses[r["status"]] += 1
        flag = "" if r["status"] == 200 else "  <<< FAIL"
        if r["status"] != 200:
            print(
                f"[{name}c {i+1:02d}] {r['status']} {r['ms']}ms "
                f"ray={r.get('cf_ray')} body={r.get('body', r.get('error',''))[:140]}{flag}",
                flush=True,
            )
    print(f"--- {name} concurrent summary: {dict(statuses)} ---", flush=True)
    return statuses


if __name__ == "__main__":
    print(f"START {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}", flush=True)
    # Cache-buster note: edge caches detail for 1.5h (s-maxage=5400). To exercise
    # the ORIGIN (worker->Aura) we must bypass the edge cache, else we measure CDN
    # hits. Append a unique query string per request to force MISS.
    run_sequential("miles", TARGETS["miles"], 30)
    run_sequential("monk", TARGETS["monk"], 30)
    run_concurrent("miles", TARGETS["miles"], 20, 10)
    run_concurrent("monk", TARGETS["monk"], 20, 10)
    print(f"\nEND {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}", flush=True)
