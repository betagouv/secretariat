# Contribuer au Secrétariat

## Environnement de développement
- Les commandes pour lancer un environnement de dev sont sur le README
- Utiliser uniquement `betagouv.ovh` comme domaine pour développer ou un autre domaine de test sur OVH si vous le souhaitez mais jamais le domaine de prod.

## Guideline
- Essayer de rendre le code un maximun contribuable par un maximun de personnes qui ne connait pas l'organisation de l'app ou le développement informatique
   - Par exemple, séparer les contenus dans des fichiers séparés et utiliser un langage simple pour les décrire
   - Le français est privilégié pour la documentation, les messages de pull request, les noms de commit et les concepts métiers dans l'application.
- Pour le code, les tests, les concepts génériques ou les noms de branche, vous devez utiliser l'anglais.
- Tester tout le temps la sécurité de l'app ou ce qui pourrait compliquer la vie des membres si ça ne marchait plus.
   - Pour les autres fonctionnalités, vous pouvez évaluer
- Privilégier la réutilisation des fonctionnalités (une même fonction pourrait être utilisée par une interaction utilisateur ou par un job et cela pourrait changer au cours du temps)
- KISS : Keep It Simple Stupid
- L'application suit les [12 factor](https://12factor.net/)

### Javascript/Typescript
- Vous pouvez écrire le nouveau code en Typescript
- On utilise `async/await`, si vous voyez des `then/catch` qui trainent vous pouvez les nettoyer


### Jobs Cron
- Faire un fichier par job, et faites en sorte qu'il puisse s'exécuter à la main
    - Si vous avez un peu de motivation, vous pouvez migrer les jobs actuels qui ne sont pas sous forme
    - Vous avez un exemple ici sur audioconf : [Jobs](https://github.com/betagouv/audioconf/tree/main/jobs) et [Scripts](https://github.com/betagouv/audioconf/tree/main/scripts)

### Tâches
- Les tâches à faire sont listées dans les [issues](https://github.com/betagouv/secretariat/issues) et priorisées dans un [projet](https://github.com/betagouv/secretariat/projects/2)
- Vous pouvez ajouter des propositions de tâches dans une issue
- Si vous voulez faire une tâche qui n'est pas priorisée, vous pouvez en discuter sur [Mattermost](https://mattermost.incubateur.net/betagouv/channels/betagouv-application-secretariat-incubateur-net)
- Vous pouvez aider à spécifier des tâches qui ne sont pas claires, en faisant des spécifications ou des propositions visuelles
- Les tâches simples à démarrer sont référencées par le label [good first issue](https://github.com/betagouv/secretariat/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

### Configuration
- La configuration de l'app se fait uniquement par variables d'environnements dans `src/config.ts`
- Essayez de rendre la configuration optionnelle
    - Mettez une configuration par défaut qui marche pour la prod
    - On ne pas de configuration par défaut pour du développement
    - Faites en sorte qu'une configuration essentielle manquante fasse soit : un non lancement de l'application ou mieux désactive les fonctionnalités concernées

### Github
- Demandez au moins une review, si vous avez un doute demandez plus de review (parlez-en sur [Mattermost](https://mattermost.incubateur.net/betagouv/channels/betagouv-application-secretariat-incubateur-net))
   - Merger quand vous pensez quand vous pensez que c'est bon
- Après le merge, la banche master est auto-deployée sur Scalingo
