# 👑 Lydie'shop

> *La boutique qui sublime les Reines* — plateforme e-commerce haut de gamme dédiée aux perruques et tissages naturels.

Application Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + Stripe + OpenAI.

---

## 🎨 Identité visuelle

| Couleur              | Hex        | Usage                          |
| -------------------- | ---------- | ------------------------------ |
| Rose poudré          | `#F8C8D4`  | Couleur principale             |
| Rose clair           | `#FDE8EE`  | Fonds doux                     |
| Rose foncé           | `#E8A0B4`  | Hover, bordures                |
| Or                   | `#C9A84C`  | Accents, titres dorés          |
| Or clair             | `#E8D08A`  | Reflets                        |
| Or foncé             | `#9A7A2E`  | Ombres                         |
| Crème                | `#FFF9F5`  | Fond de page                   |
| Encre                | `#3D2B35`  | Texte principal                |

**Typographies** : Great Vibes (titres script) · Cormorant Garamond (serif luxe) · Nunito (corps) · Raleway (UI) · Montserrat (prix).

---

## 🚀 Démarrage

```bash
# Installation
npm install

# Variables d'environnement
cp .env.example .env
# → remplissez DATABASE_URL, OPENAI_API_KEY, STRIPE_SECRET_KEY, etc.

# Base de données
npm run db:generate
npm run db:push
npm run db:seed

# Lancement
npm run dev          # http://localhost:3000
```

### Comptes de démo (après seed)

- **Admin** : `admin@lydieshop.com` / `Reine2026!` → back-office `/admin`
- **Codes promo** : `REINE10` (-10%), `BIENVENUE` (-10€)

---

## 🏗️ Structure

```
lydieshop/
├── app/
│   ├── layout.tsx                 # Layout racine (Google Fonts, ShopChrome)
│   ├── page.tsx                   # Homepage (hero, catégories, bestsellers, témoignages)
│   ├── boutique/                  # Catalogue filtrable
│   ├── produit/[slug]/            # Page produit (galerie, variantes, avis)
│   ├── panier/                    # Panier (Zustand persistant)
│   ├── checkout/                  # Tunnel d'achat 3 étapes
│   │   └── confirmation/          # Page de succès
│   ├── compte/                    # Espace cliente (commandes, favoris, points)
│   ├── suivi/                     # Tracking public d'une commande
│   ├── login/ · register/         # Auth (NextAuth à câbler)
│   ├── admin/                     # Back-office (sidebar + pages)
│   │   ├── page.tsx               # Dashboard KPIs
│   │   ├── produits/              # Liste + création avec IA
│   │   └── commandes/             # Gestion des commandes
│   └── api/
│       ├── chat/                  # Chatbot Lydie (streaming OpenAI)
│       ├── ai/generate-product/   # Génération IA de fiches produits
│       └── products/              # REST produits
├── components/
│   ├── ui/                        # Button, Input, Badge, StarRating, Crown, Sparkles
│   ├── shop/                      # Header, Footer, ProductCard, HeroSection, ...
│   ├── admin/                     # AdminSidebar, StatCard, ProductForm
│   └── chatbot/ChatWidget.tsx     # Widget conversationnel
├── lib/
│   ├── cart.ts                    # Store Zustand + règles de livraison
│   ├── products.ts                # Catalogue de démo (en prod : Prisma)
│   ├── categories.ts
│   ├── prompts.ts                 # Prompts système OpenAI (chat + génération produit)
│   ├── openai.ts · stripe.ts · prisma.ts
│   ├── format.ts · types.ts
└── prisma/
    ├── schema.prisma              # Modèle complet (users, products, orders, wishlist, reviews, promo, chat)
    └── seed.ts                    # Seed complet
```

---

## 🤖 Fonctionnalités IA

### 1. Chatbot conversationnel "Lydie" (`/api/chat`)

Widget flottant (bas-droite) qui répond aux questions produits, SAV, recommandations. Utilise `gpt-4o` en streaming, avec un system prompt qui injecte dynamiquement les produits du moment et la dernière commande de la cliente connectée (`lib/prompts.ts`).

Style : vouvoiement élégant, emojis discrets (👑✨), propose `REINE10` en cas d'hésitation.

### 2. Génération de fiches produits (`/api/ai/generate-product`)

Dans le back-office (`/admin/produits/nouveau`), l'admin renseigne le nom du produit + la catégorie + quelques mots-clés, et l'IA génère :
- Description longue et vendeuse (200-300 mots)
- Accroche courte
- Liste de caractéristiques
- Instructions d'entretien
- Tags et meta description SEO

Format de sortie garanti par `response_format: json_object`.

---

## 💳 Paiement & livraison

- **Stripe** (Payment Intents) — câblage prévu dans `lib/stripe.ts`.
- **Règles livraison** (`lib/cart.ts`) :
  - Livraison offerte dès **60€**
  - Colissimo 5,90€ (2-3 j)
  - Mondial Relay 3,90€ (3-5 j)
  - Chronopost 12,90€ (24h)

---

## 🎁 Programme fidélité

- **1€ = 10 points Couronne**
- Niveaux : 🌸 Reine Rose · 👑 Reine Or · 💎 Reine Diamant
- Récompenses : -5€ (500 pts), -12€ (1 000 pts), -30€ (2 000 pts)

Modèles Prisma : `loyaltyPoints`, `tier` sur `User`.

---

## 🛡️ Sécurité & conformité

- HTTPS, JWT httpOnly, CSRF, rate limiting (à câbler)
- RGPD : consentement cookies, droit à l'oubli
- Validation Zod sur toutes les API
- Aucune donnée carte en base (Stripe PCI-DSS)

---

## 🗺️ Roadmap

### Phase 1 — MVP (ce repo couvre la structure)
- [x] Next.js 14 + Tailwind + Prisma
- [x] Identité visuelle rose/or complète
- [x] Catalogue, page produit, panier, checkout
- [x] Back-office admin (dashboard, produits, commandes)
- [x] Chatbot IA streaming
- [x] Génération IA de fiches produits
- [ ] NextAuth (login email/password + Google)
- [ ] Stripe Checkout réel
- [ ] Upload Cloudinary dans le formulaire produit
- [ ] Emails Resend

### Phase 2
- [ ] Programme fidélité côté backend
- [ ] Wishlist persistée
- [ ] Avis clients modérés
- [ ] Export CSV commandes
- [ ] Analytics avancées

### Phase 3
- [ ] Essayage virtuel IA
- [ ] Live shopping (embed)
- [ ] Box surprise mensuelle
- [ ] PWA

---

*Document créé le 11 avril 2026 — Lydie'shop © 2026*
