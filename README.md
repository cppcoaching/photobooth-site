# Booth In Lyon — site internet

Site vitrine one-page pour Booth In Lyon (location de photobooth à Lyon et sa région), avec calendrier de disponibilités, réservation en ligne et acompte par carte bancaire.

## Structure

```
index.html                     La page (une seule page, tout est en ancres #section)
assets/css/style.css           Le design (noir & or)
assets/js/config.js            Vos identifiants Formspree / Stripe / contacts
assets/js/reviews.js           Affiche les avis depuis data/reviews.json
assets/js/booking.js           Calendrier + formulaires (réservation, contact)
assets/js/main.js              Menu mobile, petites interactions
data/unavailable-dates.json    Dates déjà réservées (à tenir à jour)
data/reviews.json              Vos avis clients affichés sur le site
assets/img/                    Logo et photos
assets/docs/                   CGV et politique de confidentialité (PDF)
```

## À faire avant la mise en ligne définitive

### 1. Mettre en ligne (GitHub Pages)
Dans le repo GitHub → **Settings → Pages** → Source : `Deploy from a branch`, branche `main`, dossier `/ (root)`. Le site sera accessible à une adresse du type `https://cppcoaching.github.io/photobooth-site/` (vous pourrez brancher un nom de domaine perso ensuite, ex. `boothinlyon.fr`, dans ce même écran).

### 2. Recevoir les emails de réservation/contact (Formspree)
1. Créez un compte gratuit sur [formspree.io](https://formspree.io) avec l'email de votre choix (ex. contact@boothinlyon.fr).
2. Créez un formulaire, copiez son URL (`https://formspree.io/f/xxxxxxx`).
3. Collez-la dans `assets/js/config.js` → `FORMSPREE_ENDPOINT`.

Les deux formulaires du site (réservation + contact) enverront alors un email directement dans votre boîte, avec la date choisie, la formule, les coordonnées du client.

### 3. Encaisser l'acompte en ligne (Stripe)
1. Créez un compte sur [dashboard.stripe.com](https://dashboard.stripe.com).
2. Menu **Payment links** → créez un lien par formule (Essentiel 259€, Classique 329€, Grand Soir 399€), avec le montant d'acompte que vous souhaitez demander (ex. 80€ / 100€ / 120€).
3. Copiez chaque lien dans `assets/js/config.js` → `STRIPE_LINKS`.

Après l'envoi du formulaire de réservation, le client voit apparaître un bouton "Verser mon acompte en ligne" qui l'emmène directement sur la page de paiement Stripe correspondant à sa formule.

### 4. Tenir le calendrier à jour
Ouvrez `data/unavailable-dates.json` et ajoutez/retirez des dates (format `AAAA-MM-JJ`) au fur et à mesure de vos réservations. Ces dates apparaissent barrées et non-sélectionnables dans le calendrier du site.
*Les dates déjà connues au moment de la création du site (retrouvées dans votre dossier "Prestations") ont été pré-remplies — vérifiez-les et complétez avec vos réservations les plus récentes.*

### 5. Mettre vos vrais avis Google
Ouvrez `data/reviews.json` et remplacez le contenu par le texte exact de vos avis Google (prénom, note, texte). Le lien "Voir tous nos avis Google" pointe déjà vers votre fiche.

### 6. Vérifier les infos de contact
Dans `assets/js/config.js` : numéro WhatsApp, email, lien Instagram, lien fiche Google — à ajuster si besoin (ils sont déjà pré-remplis avec vos infos actuelles).

## Prévisualiser en local

Depuis ce dossier, lancez un petit serveur local (nécessaire pour que les fichiers `data/*.json` se chargent correctement) :

```bash
python3 -m http.server 8000
```

Puis ouvrez http://localhost:8000 dans votre navigateur.

## Mettre à jour le site après une modification

```bash
git add -A
git commit -m "Description de la modification"
git push
```

Le site se met à jour automatiquement sur GitHub Pages quelques dizaines de secondes après le push.
