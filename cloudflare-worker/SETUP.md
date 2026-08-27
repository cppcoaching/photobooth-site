# Automatiser le calendrier après un paiement Stripe — guide débutant

## D'abord, à quoi ça sert et comment ça marche ?

Aujourd'hui, quand un client paie son acompte, **rien ne bloque automatiquement
la date** sur votre site : vous devez ouvrir un fichier et le modifier vous-même
à chaque réservation.

On va installer un petit robot (on l'appelle un **"Worker"**, littéralement
"ouvrier") qui tourne en permanence sur les serveurs de Cloudflare (gratuit) et
fait ceci, automatiquement, 24h/24 :

```
Client paie l'acompte sur Stripe
        ↓
Stripe envoie un message au Worker ("un paiement vient d'être fait, pour telle date")
        ↓
Le Worker se connecte à votre GitHub et ajoute la date dans le fichier du calendrier
        ↓
Le site se republie tout seul avec la date bloquée
```

Ce guide vous fait créer ce robot une seule fois. Ensuite, vous n'y touchez
plus jamais — il travaille tout seul en arrière-plan.

**Temps estimé : 30 à 45 minutes** la première fois, en suivant chaque étape
sans se presser. Si un mot vous échappe, allez voir le **lexique tout en bas**
du document.

---

## Avant de commencer : ouvrir le Terminal

Beaucoup d'étapes se font dans l'application **Terminal** de votre Mac (pas un
navigateur web). C'est une fenêtre noire ou blanche où l'on tape des commandes
au clavier.

**Pour l'ouvrir :** appuyez sur `Cmd + Espace` (Spotlight), tapez `Terminal`,
appuyez sur Entrée. Une fenêtre s'ouvre avec du texte et un curseur qui
clignote — c'est normal, c'est là qu'on va taper des commandes.

Ensuite, il faut se placer dans le bon dossier du projet. Tapez cette ligne
puis Entrée (adaptez le chemin si votre dossier n'est pas exactement à cet
endroit) :

```bash
cd "/Users/charlotte/Dev/site internet photobooth/cloudflare-worker"
```

Vous ne devriez voir aucune erreur, juste une nouvelle ligne qui apparaît.
**Gardez cette fenêtre de Terminal ouverte** pour toute la suite du guide —
toutes les commandes se tapent dedans, une par une, en appuyant sur Entrée
après chacune et en attendant qu'elle se termine avant de taper la suivante.

Vérifions que les outils nécessaires sont bien installés. Tapez :

```bash
node --version
```

Vous devez voir apparaître quelque chose comme `v24.16.0` (peu importe le
numéro exact, tant que ça commence par un chiffre et pas par une erreur). Si
c'est le cas, tout est prêt, passez à l'étape 1.

---

## Étape 1 — Créer une "clé d'accès" GitHub (token)

**Pourquoi ?** Le Worker doit pouvoir modifier un fichier dans votre repo
GitHub tout seul, sans que vous soyez derrière. Pour ça, GitHub demande une
"clé" spéciale (un token) qui donne un accès limité, juste pour cette tâche.

1. Ouvrez ce lien dans votre navigateur : https://github.com/settings/tokens?type=beta
   (connectez-vous à GitHub si ce n'est pas déjà fait)
2. Cliquez sur le bouton vert **"Generate new token"** en haut à droite
3. Un formulaire apparaît, remplissez-le ainsi :
   - **Token name** : tapez `boothinlyon-stripe-webhook` (le nom n'a pas
     d'importance, c'est juste pour vous souvenir à quoi il sert)
   - **Expiration** : choisissez **"No expiration"** (sinon la clé arrêtera de
     fonctionner au bout de X jours et le robot s'arrêtera sans prévenir)
   - **Description** : facultatif, vous pouvez laisser vide ou écrire "Mise à
     jour automatique du calendrier depuis Stripe"
4. Descendez à la section **"Repository access"** :
   - Cochez **"Only select repositories"**
   - Cliquez sur le menu déroulant **"Select repositories"**, cherchez et
     cochez `photobooth-site`
5. Descendez à **"Permissions"** → cliquez sur **"Repository permissions"**
   pour dérouler la liste :
   - Cherchez la ligne **"Contents"**
   - À droite, cliquez sur le menu (probablement marqué "No access") et
     choisissez **"Read and write"**
   - Laissez tout le reste tel quel
6. Descendez tout en bas, cliquez sur **"Generate token"** (bouton vert)
7. **Très important** : une clé apparaît, commençant par `github_pat_...`.
   **Copiez-la tout de suite** (bouton copier à côté) et collez-la
   temporairement dans une note ou un fichier texte sur votre bureau. **Elle
   ne sera plus jamais réaffichée** — si vous la perdez, il faudra en
   recréer une nouvelle en refaisant cette étape.

✅ **Vous devriez avoir maintenant** : une ligne de texte commençant par
`github_pat_` copiée quelque part, prête pour l'étape 3.

---

## Étape 2 — Créer un compte Cloudflare et installer l'outil de déploiement

**Pourquoi ?** Cloudflare est l'entreprise qui va héberger gratuitement notre
petit robot (le Worker). Il faut un compte chez eux, et un outil appelé
`wrangler` pour envoyer notre code vers ce compte depuis le Terminal.

1. Allez sur https://dash.cloudflare.com/sign-up
2. Créez un compte avec votre email (ex. `contact@boothinlyon.fr`) et un mot
   de passe. Confirmez votre email si demandé (email de vérification à
   cliquer).
3. Une fois connecté au tableau de bord Cloudflare, revenez au Terminal (celui
   resté ouvert dans le dossier `cloudflare-worker`) et tapez :

```bash
npm install -g wrangler
```

   Ça installe l'outil `wrangler` sur votre ordinateur (une seule fois, pour
   toujours). Ça prend quelques dizaines de secondes, vous verrez défiler du
   texte, c'est normal. À la fin, la ligne de commande redevient libre.

4. Connectez cet outil à votre compte Cloudflare :

```bash
wrangler login
```

   Cette commande **ouvre automatiquement votre navigateur** sur une page
   Cloudflare qui demande "Allow Wrangler to make changes to your Cloudflare
   account?". Cliquez sur **"Allow"**. Vous pouvez ensuite fermer cet onglet
   et revenir au Terminal, où vous devriez voir un message confirmant la
   connexion (quelque chose comme "Successfully logged in").

✅ **Vous devriez avoir maintenant** : un compte Cloudflare créé, et
`wrangler` connecté dessus depuis votre Terminal.

---

## Étape 3 — Envoyer le robot chez Cloudflare (déploiement)

Toujours dans le Terminal, dans le dossier `cloudflare-worker`, tapez :

```bash
wrangler deploy
```

Ça envoie le code du Worker vers Cloudflare. Après quelques secondes, vous
devriez voir un message se terminant par une ligne ressemblant à :

```
Published boothinlyon-stripe-webhook
  https://boothinlyon-stripe-webhook.VOTRE-COMPTE.workers.dev
```

**Copiez cette URL** (celle en `https://...workers.dev`) dans votre note à
côté du token GitHub — vous en aurez besoin à l'étape 5.

Maintenant, enregistrons la clé GitHub créée à l'étape 1 dans ce Worker, de
façon sécurisée (elle ne sera jamais visible dans le code, juste stockée
chiffrée chez Cloudflare). Tapez :

```bash
wrangler secret put GITHUB_TOKEN
```

Le Terminal affiche `Enter a secret value:` — **collez votre clé
`github_pat_...`** (clic droit → Coller, ou `Cmd+V`) puis appuyez sur Entrée.
Vous devriez voir une confirmation du type "Success! Uploaded secret
GITHUB_TOKEN".

*(Ne faites pas encore `STRIPE_WEBHOOK_SECRET`, on y revient à l'étape 5 —
il nous manque encore cette valeur.)*

✅ **Vous devriez avoir maintenant** : le Worker en ligne, avec une URL
`workers.dev`, et la clé GitHub enregistrée dedans.

---

## Étape 4 — Comprendre "mode Test" vs "mode Live" sur Stripe

**Avant de continuer**, un point important à bien comprendre pour ne pas vous
perdre : Stripe a **deux univers séparés** :

- **Mode Test** (orange, indiqué en haut du dashboard Stripe) : pour essayer
  sans vrai argent, avec de fausses cartes bancaires
- **Mode Live** (le vrai, avec de vrais paiements de vrais clients)

Un webhook créé en mode Test ne fonctionne QUE pour les paiements en mode
Test, et inversement. **On va créer le webhook deux fois** : une fois en Test
pour vérifier que tout marche sans risque, puis une fois en Live pour la
vraie mise en service. Le petit bouton pour basculer entre les deux modes se
trouve en haut à droite du dashboard Stripe (souvent écrit "Test mode" avec
un interrupteur).

---

## Étape 5 — Créer le webhook côté Stripe (en mode Test d'abord)

**Pourquoi ?** Il faut dire à Stripe : "quand un paiement est confirmé,
préviens ce Worker à cette adresse". C'est ça, un webhook.

1. Allez sur https://dashboard.stripe.com/webhooks
2. Vérifiez que vous êtes bien en **mode Test** (interrupteur en haut à
   droite, doit afficher "Test mode" activé)
3. Cliquez sur **"Add endpoint"** (ou "Créer un point de terminaison")
4. Dans **"Endpoint URL"**, collez l'URL de votre Worker obtenue à l'étape 3
   (celle en `https://boothinlyon-stripe-webhook....workers.dev`)
5. Dans **"Events to send"** (ou "Sélectionner les événements"), ne cochez
   **qu'un seul événement** : cherchez `checkout.session.completed` dans la
   barre de recherche et cochez-le. Ne cochez rien d'autre.
6. Cliquez sur **"Add endpoint"** pour valider
7. Vous arrivez sur la page de détail de ce webhook. Cherchez la section
   **"Signing secret"** (secret de signature) — cliquez sur **"Reveal"** (ou
   l'icône œil) à côté. Une valeur apparaît, commençant par `whsec_...`.
   **Copiez-la.**
8. Retournez dans votre Terminal et tapez :

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```

   Collez la valeur `whsec_...` quand demandé, puis Entrée.

✅ **Vous devriez avoir maintenant** : un webhook Stripe en mode Test pointant
vers votre Worker, et son secret enregistré dans le Worker.

---

## Étape 6 — Premier test (sans vrai argent)

On va vérifier que Stripe arrive bien à parler au Worker, sans encore tester
la mise à jour du calendrier.

1. Toujours sur la page du webhook (dashboard Stripe, mode Test), cherchez le
   bouton **"Send test webhook"** (parfois dans un menu "..." en haut à
   droite de la page)
2. Choisissez l'événement `checkout.session.completed` dans la liste, puis
   envoyez
3. Stripe affiche la réponse reçue du Worker. Vous devriez voir un code
   **`200`** (= succès) et un message texte du type "Paiement reçu, mais pas
   de date valide..." — **c'est normal et attendu** : cet événement de test
   ne contient pas de vraie date, donc le Worker le signale simplement sans
   planter. Ce qui compte ici, c'est que la connexion et la vérification de
   sécurité (signature) ont fonctionné.

Si vous voyez un code `400` ou `500` à la place, allez voir la section
**Dépannage** tout en bas.

---

## Étape 7 — Test complet, avec une vraie fausse carte bancaire

Maintenant on simule un vrai client de bout en bout, sur le site.

1. Assurez-vous que le site que vous testez utilise bien le lien Stripe en
   **mode Test** (dans `assets/js/config.js`, `STRIPE_LINKS` doit pointer
   vers un Payment Link créé en mode Test — sinon demandez-moi de vous aider
   à en créer un temporairement pour le test)
2. Sur le site, faites une réservation avec une date qui n'existe pas encore
   dans votre calendrier (ex. une date lointaine, "test")
3. Cliquez sur "Verser mon acompte en ligne"
4. Sur la page de paiement Stripe, utilisez cette carte de test bidon :
   - Numéro de carte : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future (ex. `12/30`)
   - CVC : n'importe quel 3 chiffres (ex. `123`)
   - Nom / code postal : n'importe quoi
5. Validez le paiement (aucun vrai argent ne bouge, on est en mode Test)
6. Attendez 10-20 secondes, puis allez vérifier sur GitHub :
   https://github.com/cppcoaching/photobooth-site/commits/main
   → vous devriez voir apparaître un **nouveau commit automatique**, avec un
   message du type "Réservation automatique : blocage du 20XX-XX-XX..."
7. Ouvrez le fichier `data/unavailable-dates.json` sur GitHub pour confirmer
   que votre date test y est bien ajoutée
8. **Pensez à retirer cette date test** du fichier ensuite (modification
   manuelle rapide sur GitHub, ou en local avec `git push` comme d'habitude)

Si le commit n'apparaît pas, allez voir la section **Dépannage**.

---

## Étape 8 — Passer en mode Live (la vraie mise en service)

Une fois que le test de l'étape 7 fonctionne, on répète la création du
webhook, mais **en mode Live** cette fois :

1. Sur https://dashboard.stripe.com/webhooks, basculez l'interrupteur en haut
   à droite sur le mode **Live** (celui qui n'est PAS "Test mode")
2. Refaites exactement l'étape 5 (Add endpoint → même URL de Worker → même
   événement `checkout.session.completed`)
3. Récupérez le nouveau **"Signing secret"** de ce webhook Live (différent de
   celui du mode Test !)
4. Dans le Terminal, remplacez le secret enregistré :

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```

   et collez cette fois le secret du webhook **Live**. (Le nouveau remplace
   l'ancien, un Worker ne garde qu'une seule valeur par nom de secret — c'est
   pour ça qu'on ne peut pas tester en Test et Live en même temps avec ce
   même Worker.)

5. Vérifiez que `assets/js/config.js` utilise bien vos liens Stripe **Live**
   (ceux avec lesquels de vrais clients paieront), pas des liens de test.

✅ **À partir de maintenant**, chaque vrai paiement d'acompte confirmé par un
vrai client bloquera automatiquement sa date sur le calendrier du site.

---

## Dépannage

**Le Worker renvoie une erreur 400 "Signature Stripe invalide"**
→ Le secret enregistré (`STRIPE_WEBHOOK_SECRET`) ne correspond pas au
webhook qui a envoyé la requête. Vérifiez que vous avez bien copié le
"Signing secret" du **bon** webhook (Test ou Live, et pas celui de l'autre
mode), et refaites `wrangler secret put STRIPE_WEBHOOK_SECRET` avec la bonne
valeur.

**Le Worker renvoie une erreur 500**
→ Généralement un souci côté GitHub (token expiré, mauvais nom de repo, ou
oubli de cocher "Read and write" sur Contents à l'étape 1). Vérifiez
`GITHUB_TOKEN` en le recréant si besoin (étape 1 puis
`wrangler secret put GITHUB_TOKEN` à nouveau).

**Aucun nouveau commit n'apparaît sur GitHub après un paiement test**
→ Vérifiez d'abord, sur la page du webhook dans Stripe, l'onglet listant les
tentatives d'envoi ("Webhook attempts" / "Events") : cliquez sur la tentative
la plus récente pour voir la réponse exacte renvoyée par le Worker, ça dit
en général exactement ce qui a coincé.

**`wrangler: command not found` dans le Terminal**
→ L'installation de l'étape 2 n'a pas fonctionné. Refaites
`npm install -g wrangler` et regardez s'il y a un message d'erreur en rouge à
vous montrer.

**Vous êtes bloquée à n'importe quelle étape**
→ Recopiez-moi le message d'erreur exact affiché (dans le Terminal ou sur la
page web), je vous aiderai à le résoudre.

---

## Limites à connaître

- Si un client paie sans être passé par le formulaire de réservation du site
  (lien envoyé à la main par SMS par exemple), la date ne sera **pas**
  bloquée automatiquement — il faudra l'ajouter comme avant, à la main.
- Le Worker **ajoute** une date mais ne la **retire jamais** automatiquement.
  En cas d'annulation ou de remboursement, retirez la date à la main dans
  `data/unavailable-dates.json`.
- Plan gratuit Cloudflare : 100 000 requêtes par jour — vous n'en utiliserez
  que quelques-unes par mois, aucun risque de dépassement ni de facturation.

---

## Lexique

- **Terminal** : l'application sur votre Mac où l'on tape des commandes texte
  au lieu de cliquer sur des boutons.
- **Terminal / ligne de commande** : chaque instruction se tape puis on
  appuie sur Entrée pour l'exécuter.
- **Token / clé d'accès** : un mot de passe spécial donné à un programme
  (ici, à GitHub) pour qu'il puisse agir à votre place, sans connaître votre
  vrai mot de passe.
- **Secret** : une valeur sensible (mot de passe, clé) qu'on ne doit jamais
  rendre publique ni mettre directement dans le code.
- **Worker** : le nom que donne Cloudflare à un petit programme hébergé chez
  eux qui réagit à des requêtes (ici, aux messages envoyés par Stripe).
- **Webhook** : un mécanisme où un service (Stripe) prévient automatiquement
  un autre service (notre Worker) dès qu'un événement se produit (ici, un
  paiement confirmé), en lui envoyant un message.
- **Endpoint** : l'adresse (URL) à laquelle on envoie ce message.
- **Déployer / déploiement** : envoyer le code du Worker pour qu'il devienne
  actif en ligne.
- **Repo (repository)** : le dossier de votre projet hébergé sur GitHub.
- **Commit** : un enregistrement d'une modification dans le repo GitHub,
  avec un message expliquant ce qui a changé.
