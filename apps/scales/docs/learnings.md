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