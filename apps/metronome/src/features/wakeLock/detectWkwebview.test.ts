import { describe, expect, it } from 'vitest'
import { isWkwebviewUa } from './detectWkwebview'

const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1'
const CHROME_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

describe('isWkwebviewUa — true positives', () => {
  it.each([
    ['Slack', `${SAFARI_IOS} Slack/24.05.10`],
    ['Discord', `${SAFARI_IOS} Discord/9999`],
    ['Facebook (FBAN)', `${SAFARI_IOS} [FBAN/FBIOS;FBAV/443.0.0.42.110]`],
    ['Instagram', `${SAFARI_IOS} Instagram 285.0.0.20.119`],
    ['Line', `${SAFARI_IOS} Line/13.0.0`],
    ['Twitter', `${SAFARI_IOS} Twitter for iPhone`],
    ['X (rebranded)', `${SAFARI_IOS} X/10.0`],
    ['LinkedIn', `${SAFARI_IOS} LinkedInApp/9.27.0`],
    ['Claude iOS', `${SAFARI_IOS} Claude/1.2.3`],
  ] as const)('flags %s', (_name, ua) => {
    expect(isWkwebviewUa(ua)).toBe(true)
  })
})

describe('isWkwebviewUa — true negatives', () => {
  it.each([
    ['Safari iOS', SAFARI_IOS],
    ['Chrome iOS', CHROME_IOS],
    ['Chrome desktop', CHROME_DESKTOP],
    ['empty UA', ''],
  ] as const)('does NOT flag %s', (_name, ua) => {
    expect(isWkwebviewUa(ua)).toBe(false)
  })
})
