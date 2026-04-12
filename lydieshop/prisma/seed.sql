-- ============================================================================
-- Lydie'shop — Seed SQL (données de démo)
-- ============================================================================
-- Équivalent de `npm run db:seed`. À coller dans Supabase SQL Editor → Run
-- APRÈS avoir exécuté schema.sql sur la même base.
--
-- Ce seed insère :
--   • 1 admin : admin@lydieshop.com / Reine2026!  ← CHANGER immédiatement
--   • 4 catégories (perruques, tissages, accessoires, cadeaux)
--   • 6 produits de démo avec leurs variants et images
--   • 2 codes promo : REINE10 (-10%) et BIENVENUE (-10€)
--
-- IDs : pour un seed idempotent et prévisible, on utilise des IDs fixes en
-- clair au lieu des cuid() générés par Prisma. Toutes les requêtes Prisma
-- continueront à fonctionner normalement (le type du champ `id` est TEXT,
-- pas un format imposé).
--
-- Idempotence : tous les INSERT utilisent `ON CONFLICT DO NOTHING` sur la clé
-- unique appropriée, donc relancer ce fichier plusieurs fois est sûr.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Admin
-- ============================================================================
-- Mot de passe : "Reine2026!" — hash bcrypt (cost 10) généré via bcryptjs.
-- /!\ À changer immédiatement après la première connexion en prod.
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "loyaltyPoints", "tier", "createdAt", "updatedAt")
VALUES (
  'usr_admin_lydieshop',
  'admin@lydieshop.com',
  'Lydie Admin',
  '$2a$10$02jEyB97YsiGVhwjJwoYye/bZO5f9fhOhMCi9TbyqFidbAZejM5hS',
  'SUPER_ADMIN',
  0,
  'ROSE',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO NOTHING;

-- ============================================================================
-- 2. Catégories
-- ============================================================================
INSERT INTO "Category" ("id", "slug", "name", "image") VALUES
  ('cat_perruques',   'perruques',   'Perruques',   'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80'),
  ('cat_tissages',    'tissages',    'Tissages',    'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80'),
  ('cat_accessoires', 'accessoires', 'Accessoires', 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80'),
  ('cat_cadeaux',     'cadeaux',     'Cadeaux',     'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80')
ON CONFLICT ("slug") DO NOTHING;

-- ============================================================================
-- 3. Produits
-- ============================================================================
-- 3.1  Perruque Majesté — Noir Naturel
INSERT INTO "Product" (
  "id", "slug", "name", "description", "shortDesc",
  "price", "comparePrice", "stock", "categoryId",
  "tags", "features", "careInstructions",
  "isFeatured", "isNew", "isActive", "rating", "reviewCount",
  "createdAt", "updatedAt"
) VALUES (
  'prd_majeste_noir',
  'perruque-majeste-noir-naturel',
  $name$Perruque Majesté — Noir Naturel$name$,
  $desc$La Majesté, c'est le port de tête d'une Reine. Confectionnée à la main avec 100% cheveux naturels Remy, cette perruque lace frontale 13x4 épouse parfaitement votre front pour un rendu invisible. Le 18 pouces tombe délicatement sur les épaules et encadre le visage avec élégance. Préplumée, blanchie aux nœuds, prête à porter dès déballage.$desc$,
  'Lace frontale 13x4, 100% cheveux naturels, 18 pouces.',
  249, 299, 12, 'cat_perruques',
  ARRAY['bestseller','lace-frontal','naturel']::TEXT[],
  ARRAY[
    '100% cheveux humains Remy',
    'Lace HD 13x4 transparent',
    $$Densité 180%$$,
    'Préplumée, prête à porter',
    'Teinture et décoloration possibles'
  ]::TEXT[],
  $care$Lavez avec un shampoing sans sulfate tous les 10-14 jours. Appliquez un masque hydratant. Séchez à l'air libre et démêlez délicatement à partir des pointes.$care$,
  true, false, true, 4.9, 128,
  NOW(), NOW()
) ON CONFLICT ("slug") DO NOTHING;

-- 3.2  Perruque Diva — Body Wave Miel
INSERT INTO "Product" (
  "id", "slug", "name", "description", "shortDesc",
  "price", "comparePrice", "stock", "categoryId",
  "tags", "features", "careInstructions",
  "isFeatured", "isNew", "isActive", "rating", "reviewCount",
  "createdAt", "updatedAt"
) VALUES (
  'prd_diva_body',
  'perruque-diva-body-wave-miel',
  $name$Perruque Diva — Body Wave Miel$name$,
  $desc$La Diva illumine chaque entrée. Ses ondulations body wave parfaitement dessinées et son balayage miel ensoleillé apportent du volume et une lumière incomparable à votre silhouette. Une perruque qui se remarque, pour celles qui ne passent jamais inaperçues.$desc$,
  'Ondulations body wave, reflets miel, 20 pouces.',
  289, NULL, 7, 'cat_perruques',
  ARRAY['nouveau','body-wave','balayage']::TEXT[],
  ARRAY[
    'Cheveux humains Remy',
    'Balayage miel haute définition',
    'Lace frontale 13x6',
    'Ondulations longue durée'
  ]::TEXT[],
  'Utilisez un après-shampoing hydratant et un spray thermoprotecteur avant coiffage. Ravivez les boucles avec un diffuseur.',
  true, true, true, 4.8, 54,
  NOW(), NOW()
) ON CONFLICT ("slug") DO NOTHING;

-- 3.3  Perruque Impératrice — Kinky Curl
INSERT INTO "Product" (
  "id", "slug", "name", "description", "shortDesc",
  "price", "comparePrice", "stock", "categoryId",
  "tags", "features", "careInstructions",
  "isFeatured", "isNew", "isActive", "rating", "reviewCount",
  "createdAt", "updatedAt"
) VALUES (
  'prd_imperatrice_kinky',
  'perruque-imperatrice-kinky-curl',
  $name$Perruque Impératrice — Kinky Curl$name$,
  $desc$L'Impératrice célèbre les courbes et les textures naturelles. Ses boucles kinky curl rebondissantes offrent un volume spectaculaire et un style authentique. Full lace pour un confort total et une liberté de coiffage absolue.$desc$,
  'Boucles afro naturelles, full lace, 16 pouces.',
  319, 369, 5, 'cat_perruques',
  ARRAY['full-lace','kinky-curl','premium']::TEXT[],
  ARRAY[
    'Full lace 360°',
    'Cheveux vierges non traités',
    $$Densité 200%$$,
    'Texture kinky curl authentique'
  ]::TEXT[],
  $care$Pulvérisez un mélange eau + leave-in tous les matins. Démêlez humide à la main. Évitez les produits à base d'huile minérale.$care$,
  true, false, true, 5.0, 76,
  NOW(), NOW()
) ON CONFLICT ("slug") DO NOTHING;

-- 3.4  Tissage Soie Royal — Straight
INSERT INTO "Product" (
  "id", "slug", "name", "description", "shortDesc",
  "price", "comparePrice", "stock", "categoryId",
  "tags", "features", "careInstructions",
  "isFeatured", "isNew", "isActive", "rating", "reviewCount",
  "createdAt", "updatedAt"
) VALUES (
  'prd_tissage_straight',
  'tissage-soie-royal-straight',
  $name$Tissage Soie Royal — Straight$name$,
  $desc$Un tissage d'une fluidité incomparable. Trois bundles de cheveux naturels lissés à la perfection, pour un rendu soyeux digne des plus grands défilés. Se teint et se coiffe selon vos envies.$desc$,
  'Cheveux naturels lisses, 3 bundles, 20 pouces.',
  189, NULL, 20, 'cat_tissages',
  ARRAY['tissage','straight','bundles']::TEXT[],
  ARRAY[
    '3 bundles de 100g',
    'Cheveux Remy vierges',
    'Finition soyeuse longue durée',
    'Compatible coloration'
  ]::TEXT[],
  'Lavez 1 fois par semaine. Utilisez une huile légère sur les pointes après le séchage.',
  true, false, true, 4.7, 203,
  NOW(), NOW()
) ON CONFLICT ("slug") DO NOTHING;

-- 3.5  Bonnet Wig Grip Velours
INSERT INTO "Product" (
  "id", "slug", "name", "description", "shortDesc",
  "price", "comparePrice", "stock", "categoryId",
  "tags", "features", "careInstructions",
  "isFeatured", "isNew", "isActive", "rating", "reviewCount",
  "createdAt", "updatedAt"
) VALUES (
  'prd_bonnet_wig_grip',
  'bonnet-wig-grip-velours',
  'Bonnet Wig Grip Velours',
  $desc$Un essentiel pour sécuriser votre perruque toute la journée, sans compromettre le confort. Son toucher velours doux et son rose poudré signature font de lui un accessoire aussi utile qu'élégant.$desc$,
  'Bonnet antidérapant en velours rose poudré.',
  14.9, NULL, 80, 'cat_accessoires',
  ARRAY['accessoire','bestseller']::TEXT[],
  ARRAY[
    'Velours doux antidérapant',
    'Réglable — taille unique',
    'Lavable en machine à froid'
  ]::TEXT[],
  'Lavage machine 30°C, séchage à plat.',
  false, false, true, 4.6, 412,
  NOW(), NOW()
) ON CONFLICT ("slug") DO NOTHING;

-- 3.6  Coffret Reine d'un Jour
INSERT INTO "Product" (
  "id", "slug", "name", "description", "shortDesc",
  "price", "comparePrice", "stock", "categoryId",
  "tags", "features", "careInstructions",
  "isFeatured", "isNew", "isActive", "rating", "reviewCount",
  "createdAt", "updatedAt"
) VALUES (
  'prd_coffret_reine',
  'coffret-reine-d-un-jour',
  $name$Coffret Reine d'un Jour$name$,
  $desc$Un coffret somptueux à offrir à celle qui règne sur votre cœur (ou à vous-même, vous le méritez). Un soin cheveux, un bonnet velours et un peigne doré, présentés dans un écrin rose et or.$desc$,
  'Coffret cadeau : soin + bonnet + peigne doré.',
  49, 69, 25, 'cat_cadeaux',
  ARRAY['cadeau','coffret','promo']::TEXT[],
  ARRAY[
    'Soin hydratant 100ml',
    'Bonnet wig grip velours',
    'Peigne métal doré',
    'Écrin rose et or'
  ]::TEXT[],
  $care$Voir les instructions de chaque produit à l'intérieur.$care$,
  true, true, true, 4.9, 38,
  NOW(), NOW()
) ON CONFLICT ("slug") DO NOTHING;

-- ============================================================================
-- 4. Images produit (une ligne par image, position = ordre d'affichage)
-- ============================================================================
INSERT INTO "ProductImage" ("id", "productId", "url", "position") VALUES
  -- Majesté (3 images)
  ('img_majeste_0', 'prd_majeste_noir', 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=900&q=80', 0),
  ('img_majeste_1', 'prd_majeste_noir', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=900&q=80', 1),
  ('img_majeste_2', 'prd_majeste_noir', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80', 2),
  -- Diva (2 images)
  ('img_diva_0',    'prd_diva_body',    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=900&q=80', 0),
  ('img_diva_1',    'prd_diva_body',    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80', 1),
  -- Impératrice (2 images)
  ('img_imp_0',     'prd_imperatrice_kinky', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&q=80', 0),
  ('img_imp_1',     'prd_imperatrice_kinky', 'https://images.unsplash.com/photo-1507101105822-7472b28e22ac?w=900&q=80', 1),
  -- Tissage Straight (1 image)
  ('img_tiss_0',    'prd_tissage_straight',  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=900&q=80', 0),
  -- Bonnet (1 image)
  ('img_bonnet_0',  'prd_bonnet_wig_grip',   'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=900&q=80', 0),
  -- Coffret (1 image)
  ('img_coffret_0', 'prd_coffret_reine',     'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=900&q=80', 0)
ON CONFLICT ("id") DO NOTHING;

-- ============================================================================
-- 5. Variants produit
-- ============================================================================
INSERT INTO "ProductVariant" ("id", "productId", "name", "length", "stock") VALUES
  -- Majesté : 3 longueurs
  ('var_majeste_16', 'prd_majeste_noir',      '16 pouces', '16"', 4),
  ('var_majeste_18', 'prd_majeste_noir',      '18 pouces', '18"', 5),
  ('var_majeste_20', 'prd_majeste_noir',      '20 pouces', '20"', 3),
  -- Diva : 2 longueurs
  ('var_diva_18',    'prd_diva_body',         '18 pouces', '18"', 3),
  ('var_diva_22',    'prd_diva_body',         '22 pouces', '22"', 4),
  -- Impératrice : 2 longueurs
  ('var_imp_14',     'prd_imperatrice_kinky', '14 pouces', '14"', 2),
  ('var_imp_16',     'prd_imperatrice_kinky', '16 pouces', '16"', 3),
  -- Tissage : 3 longueurs
  ('var_tiss_16',    'prd_tissage_straight',  '16 pouces', '16"', 8),
  ('var_tiss_20',    'prd_tissage_straight',  '20 pouces', '20"', 7),
  ('var_tiss_24',    'prd_tissage_straight',  '24 pouces', '24"', 5)
ON CONFLICT ("id") DO NOTHING;

-- ============================================================================
-- 6. Codes promo
-- ============================================================================
INSERT INTO "PromoCode" ("id", "code", "type", "value", "isActive") VALUES
  ('promo_reine10',   'REINE10',   'PERCENT', 10, true),
  ('promo_bienvenue', 'BIENVENUE', 'FIXED',   10, true)
ON CONFLICT ("code") DO NOTHING;

COMMIT;

-- ============================================================================
-- Vérification rapide — à lancer après le seed pour confirmer les comptes.
-- ============================================================================
--
-- SELECT
--   (SELECT COUNT(*) FROM "User")           AS users,
--   (SELECT COUNT(*) FROM "Category")       AS categories,
--   (SELECT COUNT(*) FROM "Product")        AS products,
--   (SELECT COUNT(*) FROM "ProductImage")   AS images,
--   (SELECT COUNT(*) FROM "ProductVariant") AS variants,
--   (SELECT COUNT(*) FROM "PromoCode")      AS promos;
--
-- Attendu : users=1  categories=4  products=6  images=10  variants=10  promos=2
