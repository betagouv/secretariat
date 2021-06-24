# Contribuer au Secretariat

## Environnement de développement
- Les commandes pour lancer un environnement de dev sont sur le README
- Utiliser uniquement `betagouv.ovh` comme domaine pour développer ou un autre domaine de test sur OVH si vous le souhaitez mais jamais le domaine de prod.

## Guideline
- Essayer de rendre le code un maximun contribuable par un maximun de personnes qui ne connait pas l'organisation de l'app ou le développement informatique
   - Par exemple, séparé les contenues dans des fichiers séparés et utiliser un langage simple pour les décrires
   - Le français est privilégié pour la documentation, les messages de pull request, les noms de commit et les concepts métiers dans l'application.
- Pour le code, les tests, les concepts génériques ou les noms de branche vous devez utiliser l'anglais.
- Tester tous le temps la sécurité de l'app ou ce qui pourrait compliquer la vie des membres si ça ne marchait plus. 
   - Pour les autres fonctionnalités, vous pouvez évaluer 
- Préviligier la réutilisation des fonctionnalités (une même fonction pourrait être utilisé par une interraction utilisateur ou par un job et cela pourrait changer au cours du temps)
- KISS : Keep It Simple Stupid
- L'application suit les [12 factor](https://12factor.net/)

### Javascript/Typescript
- Vous pouvez écrire le nouveau code en Typescript
- On utilise `async/await`, si vous voyez des `then/catch` qui trainent vous pouvez les nettoyez


### Jobs Cron
- Faire un fichier par job, et faite en sorte qu'il puisse s'exécuter à la main
    - Si vous avez un peu de motivation, vous migrez les jobs actuels qui ne sont pas sous forme
    - Vous avez un exemple ici sur audioconf : [Jobs](https://github.com/betagouv/audioconf/tree/main/jobs) et [Scripts](https://github.com/betagouv/audioconf/tree/main/scripts)

### Taches
- Les taches à faire sont listé dans les [issues](https://github.com/betagouv/secretariat/issues) et priorisé dans un [projet](https://github.com/betagouv/secretariat/projects/2)
- Vous pouvez ajouter des propositions de taches dans une issue
- Si vous voulez faire une tache qui n'est pas priorisé, vous pouvez en discuter sur [Mattermost](https://mattermost.incubateur.net/betagouv/channels/betagouv-application-secretariat-incubateur-net)
- Vous pouvez aider à spécifier des taches qui ne sont pas claire, en faisant des specs ou des propositions visuels 
- Les taches simples à démarrer sont référencé par le label [good first issue](https://github.com/betagouv/secretariat/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

### Configuration
- La configuration de l'app se fait uniquement par variables d'environnements dans `src/config.js`
- Essayez de rendre la configuration optionnel 
    - Mettez une configuration par défaut qui marche pour la prod
    - On ne pas de configuration par défaut pour du développement
    - Faite en sorte qu'un configuration essentiel manquante fasse soit : un non lancement de l'application ou mieux désactive les fonctionnalités concernés

### Github
- Demander au moins une review, si vous avez un doute demander plus de review (parlez-en sur [Mattermost](https://mattermost.incubateur.net/betagouv/channels/betagouv-application-secretariat-incubateur-net)) 
   - Mergé quand vous pensez quand vous pensez que c'est bon
- Après le merge, la banche master est auto-deployé sur Scalingo
