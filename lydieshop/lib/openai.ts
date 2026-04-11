import OpenAI from "openai";

// Client OpenAI singleton — utilisé par le chatbot et la génération de fiches produits.
// Nécessite OPENAI_API_KEY dans les variables d'environnement.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODEL_CHAT = "gpt-4o";
export const MODEL_PRODUCT = "gpt-4o";
