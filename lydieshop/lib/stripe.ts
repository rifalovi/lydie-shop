import Stripe from "stripe";

// Client Stripe serveur — à n'importer que depuis les routes API ou server components.
// On laisse Stripe utiliser la version d'API par défaut de la lib installée.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  typescript: true,
});
