/**
 * Configuration du site Booth In Lyon.
 * Remplacez les valeurs ci-dessous par vos identifiants réels.
 * Voir le README.md à la racine du projet pour la marche à suivre complète.
 */
window.BOOTH_CONFIG = {
  // Créez un formulaire sur https://formspree.io (gratuit) et collez son ID ici.
  // L'URL ressemble à : https://formspree.io/f/abcdwxyz
  FORMSPREE_ENDPOINT: "https://formspree.io/f/mvkpjoee",

  // Créez un lien de paiement par formule sur https://dashboard.stripe.com/payment-links
  // (montant de l'acompte défini directement dans Stripe). Collez chaque lien ci-dessous.
  STRIPE_LINKS: {
    essentiel: "https://buy.stripe.com/3cIdR8ePR19y44C3ko1Fe02",
    classique: "https://buy.stripe.com/3cIdR8ePR19y44C3ko1Fe02",
    grandsoir: "https://buy.stripe.com/3cIdR8ePR19y44C3ko1Fe02"
  },

  // Montants d'acompte affichés à titre indicatif sur le site (à ajuster librement).
  ACOMPTES: {
    essentiel: 80,
    classique: 100,
    grandsoir: 120
  },

  WHATSAPP_NUMBER: "33649127272",
  EMAIL: "contact@boothinlyon.fr",
  INSTAGRAM_URL: "https://instagram.com/boothinlyon",
  GOOGLE_FICHE_URL: "https://share.google/9XU8M9jaBOnhDk6b7"
};
