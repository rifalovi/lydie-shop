import Stripe from "stripe";

// Client Stripe serveur — attention à n'importer que depuis les routes API ou server components.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});
