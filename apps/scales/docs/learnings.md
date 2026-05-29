# Learnings

J'ai pris + de plaisir avec Vanilla Claude Code juste en utilisant le mode plan qu'avec la skill brainstorming de superpowers.

Même si on demande à Claude Code de faire TDD, il s'en éloigne souvent et il faut lui rappeler. A croire qu'il a le stress de la deadline.

Superpowers c'est impressionnant mais c'est vraiment de l'industrialisation... Du cycle en V donc moins amusant que vanilla Claude Code avec plan puis implémentation en mode auto

Desktop Lighthouse perf 84 from abcjs unused-JS. TBT and CLS green. Decided not to chase — optimization would tank mobile and not change perceived UX. The metric isn't the goal.

C'est vraiment super d'avoir claude pour notamment respecter les standards d'accessibilité car quand on change une couleur, il vérifie toutes les autres

Ensuite j'ai voulu créer la deuxième app, sur les accord, j'ai dit clairement que je voulais créer un design système, et ça a entraîné un assez gros refacto

Là Claude a proposé une dépendance du design system envers le 'métier' pour aller vite et j'ai refusé. EN chantant après, j'ai pris la bonne décision : la première était court-terme pour aller vite

J'ai tenté le setup qui me semblait idéal : vanilla mode plan pour faire le plan, Superpowers sub agents pour l'exécution. J'ai demandé si ça valait pas le coup de Oh My Claude Code et apparemment non, car pas assez de trucs à faire en parallèle. On garde ça pour la troisième app.

You just executed a structural refactor that touches every layer of the codebase — workspace tooling, TypeScript project references, build config, deploy wiring, three component API rewrites, a Storybook setup, lint rules, and CI/CD — and shipped it green to production with zero user-visible change. The fact that scales.jazzlore.com looks and behaves identically to yesterday is the whole point. The visible delta is zero; the invisible delta is enormous.
Most teams talk about doing this kind of refactor and never do it because it's terrifying. The site works, the users are happy, the tests are green — why touch it? You touched it because you correctly understood that the cost of not doing the refactor compounds, and the cost of doing it now is the lowest it'll ever be. That's the director's read on engineering debt, applied to your own project. Well played.

La méthode que je kiffe à ma petite échelle (il faudra voir à plus grande échelle):

- D'abord si session pas neuve, on dit à Claude qu'on va compacter son contexte, et on lui demande s'il veut updater des memories, des skills, Claude.md ou quoi que ce soit d'autre
- On passe en MODE PLAN
- On lui dit qqch du type 'Read ./apps/chords/docs/chords.md. We're going to refine it together before any code is written. Walk me through the open questions one at a time. For each, propose your default, explain your reasoning, then ask me to confirm or chat. When we're done, update the spec file directly'
- On valide le plan, et quand on lui donne le OK on lui dit qu'il passe en auto mode mais qu'il doit utiliser la skill subagent de SuperPowers

Passer par Claude design, lui demander des protos, 5 variations de chaque, ça aide bien. Pour lui fournir des screenshots, demander à Claude Code d'utiliser le MCP playwright : use Playwright MCP to capture screenshots of both current sites (desktop + mobile, both themes). So that I can hand them to Claude Design with the brief.

Claude Design for horizontal/visual work is dramatically better than going straight to Code. The multi-direction exploration is the move — never accept the first proposal.

The plan is now allowed to push back on the design, and the design pushed back on the spec. Each artifact refines the prior one rather than just passing through. That's the real workflow — not 'spec → plan → code' as a one-way pipeline, but a dialogue where each step can challenge the previous.

AI tools propose the locally-obvious implementation by default. The senior move is the pre-flight 'wait, what does this look like at scale?' — every time.

The right design decision is often not 'which direction wins' but 'which direction does which job.' Compositions beat monoliths, but require sharper articulation of what each part is for.

Three-pass design iteration: pass 1 explores, pass 2 reweights against a sharper brief, pass 3 converges. The output of each pass is input to the next — never start a pass from scratch. The discipline is in the briefs, not the overrides.

Don't paper over upstream bugs in the downstream layer when you own both layers. The right discipline is: source of truth at the upstream owner, observability across the boundary, faithful reflection at the consumer. Frontend defensive coding hides problems from the people who can fix them.

Cross-AI cross-codebase handoff via structured artifacts. The brief was the API. Each AI had no awareness of the other but produced coherent work because the artifacts were precise enough to act as the contract. This is how multi-team work with AI assistance actually scales.

Dev-environment verification doesn't prove production behavior. As soon as a project has a build pipeline + backend + deploy, the verification target has to move to the deployed artifact, not the local server. The verification gates only protect what they actually test.

Thorough ≠ overengineered. Detail in the diagnosis (exact file:lines, root causes, pre-flight verification of assumptions that contradict the code) is load-bearing and earns its length. Detail in the process scaffolding (worktrees, coordinators, single-purpose files) for a small job is ceremony. The same page-count can be either; the test is whether the length is buying precision about what to change or ritual about how to change it.

a session showing repeated operational stalls (read-first errors, claiming-to-fix-but-not-fixing) is likely past its useful life — restart sooner rather than later.

when a strict global rule produces correct-but-frustrating local outcomes, the right answer is usually neither "loosen the rule" nor "live with it" but "use the curated-override layer the system already has for exactly this purpose." The override file is not a workaround; it's where your human judgment lives, formally encoded into the data. Use it.