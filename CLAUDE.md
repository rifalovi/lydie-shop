# Assistant SCS — Guide de développement

## Commandes
- `npm run dev` : démarrage local (port 3000)
- `npm run build` : build production
- `npm run db:seed` : injection du cas pilote CLAC P05

## Variables d'environnement requises
```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Architecture clé
- Tous les appels Claude passent par `/api/chat` ou les routes `/api/*/`
- Le system prompt GAR/S&E est injecté dans CHAQUE appel (voir `/lib/prompts/system.ts`)
- Le contexte projet est récupéré depuis Supabase et injecté dynamiquement
- Les composants UI utilisent Tailwind CSS + couleurs OIF définies dans `tailwind.config.ts`

## Structure
```
app/
  (authenticated)/       → Pages protégées par auth (layout avec sidebar)
    dashboard/           → Tableau de bord
    modules/incubation/  → Module d'incubation 6 étapes (PRIORITAIRE)
    modules/formation/   → Formation GAR/S&E
    modules/indicateurs/ → Vue indicateurs SMART
    modules/analyse-era/ → Analyse ERA
    chat/                → Chat IA plein écran
  api/chat/              → Streaming chat avec Claude
  api/incubation/suggest/→ Suggestions IA contextuelles
  api/indicators/        → Génération + test SMART
  api/era/               → Analyse ERA + codage thématique
  login/ & signup/       → Auth Supabase
components/
  AppShell.tsx           → Shell avec sidebar navigation
  ChatWidget.tsx         → Chatbot flottant / plein écran
  incubation/            → Composants des 6 étapes
lib/
  supabase/              → Clients Supabase (browser, server, admin)
  prompts/system.ts      → System prompts pour Claude
  types.ts               → Types TypeScript
supabase/schema.sql      → Schéma complet de la base de données
scripts/seed.ts          → Seed du cas pilote CLAC P05
```

## Règles de développement
- Toujours valider les indicateurs contre le schéma Référentiel SSE OIF
- La nomenclature codes (IND-PS#-DOM-###) doit être générée côté serveur
- Les données ERA brutes ne doivent jamais être exposées côté client
- Consentement RGPD obligatoire avant tout import de données ERA
- Toutes les réponses de l'IA doivent être en français
