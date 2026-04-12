-- ============================================================================
-- Lydie'shop — Migration : attributs dynamiques (AttributeTemplate + ProductAttribute)
-- ============================================================================
-- À exécuter dans Supabase SQL Editor (un seul "Run").
-- ============================================================================

-- Enum
DO $$ BEGIN
  CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'SELECT', 'NUMBER', 'BOOLEAN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "AttributeTemplate" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL DEFAULT 'TEXT',
    "unit" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AttributeTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttributeTemplate_categoryId_name_key"
    ON "AttributeTemplate"("categoryId", "name");
CREATE INDEX IF NOT EXISTS "AttributeTemplate_categoryId_idx"
    ON "AttributeTemplate"("categoryId");

CREATE TABLE IF NOT EXISTS "ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProductAttribute_productId_templateId_key"
    ON "ProductAttribute"("productId", "templateId");

-- Foreign keys (idempotent via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AttributeTemplate_categoryId_fkey') THEN
    ALTER TABLE "AttributeTemplate" ADD CONSTRAINT "AttributeTemplate_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ProductAttribute_productId_fkey') THEN
    ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ProductAttribute_templateId_fkey') THEN
    ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_templateId_fkey"
      FOREIGN KEY ("templateId") REFERENCES "AttributeTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Seed : attributs pré-configurés par catégorie
-- ============================================================================
-- Utilise les IDs de catégories du seed existant (cat_perruques, etc.)
-- ON CONFLICT pour idempotence.
-- ============================================================================

-- PERRUQUES
INSERT INTO "AttributeTemplate" ("id","categoryId","name","type","options","isRequired","position") VALUES
  ('at_perr_type',    'cat_perruques','Type de perruque','SELECT',ARRAY['Lace front','Full lace','360 lace','U-part','Headband','Closure'],true,1),
  ('at_perr_longueur','cat_perruques','Longueur','SELECT',ARRAY['8"','10"','12"','14"','16"','18"','20"','22"','24"','26"','28"','30"'],true,2),
  ('at_perr_texture', 'cat_perruques','Texture','SELECT',ARRAY['Lisse (Straight)','Ondulée (Body Wave)','Bouclée (Deep Wave)','Kinky Curl','Kinky Straight','Water Wave','Loose Wave'],true,3),
  ('at_perr_densite', 'cat_perruques','Densité','SELECT',ARRAY['130%','150%','180%','200%','250%'],true,4),
  ('at_perr_couleur', 'cat_perruques','Couleur','TEXT',ARRAY[]::TEXT[],false,5),
  ('at_perr_origine', 'cat_perruques','Origine cheveux','SELECT',ARRAY['100% naturel (Remy)','Naturel vierge','Synthétique','Mélange'],true,6)
ON CONFLICT ("categoryId","name") DO NOTHING;

-- TISSAGES
INSERT INTO "AttributeTemplate" ("id","categoryId","name","type","options","isRequired","position") VALUES
  ('at_tiss_longueur','cat_tissages','Longueur','SELECT',ARRAY['8"','10"','12"','14"','16"','18"','20"','22"','24"','26"','28"','30"'],true,1),
  ('at_tiss_texture', 'cat_tissages','Texture','SELECT',ARRAY['Lisse','Ondulé','Bouclé','Kinky Curl','Deep Wave','Water Wave'],true,2),
  ('at_tiss_origine', 'cat_tissages','Origine','SELECT',ARRAY['100% naturel (Remy)','Naturel vierge','Synthétique','Mélange'],true,3),
  ('at_tiss_bundles', 'cat_tissages','Nombre de paquets','SELECT',ARRAY['1','2','3','4'],false,4),
  ('at_tiss_gramm',  'cat_tissages','Grammage','NUMBER',ARRAY[]::TEXT[],false,5)
ON CONFLICT ("categoryId","name") DO NOTHING;

-- ACCESSOIRES
INSERT INTO "AttributeTemplate" ("id","categoryId","name","type","options","isRequired","position") VALUES
  ('at_acc_matiere',  'cat_accessoires','Matière','TEXT',ARRAY[]::TEXT[],false,1),
  ('at_acc_dim',      'cat_accessoires','Dimensions','TEXT',ARRAY[]::TEXT[],false,2),
  ('at_acc_couleur',  'cat_accessoires','Couleur','TEXT',ARRAY[]::TEXT[],false,3)
ON CONFLICT ("categoryId","name") DO NOTHING;

-- CADEAUX
INSERT INTO "AttributeTemplate" ("id","categoryId","name","type","options","isRequired","position") VALUES
  ('at_cad_contenu',  'cat_cadeaux','Contenu','TEXT',ARRAY[]::TEXT[],false,1),
  ('at_cad_occasion', 'cat_cadeaux','Occasion','SELECT',ARRAY['Anniversaire','Noël','Saint-Valentin','Fête des mères','Toute occasion'],false,2),
  ('at_cad_perso',    'cat_cadeaux','Personnalisable','BOOLEAN',ARRAY[]::TEXT[],false,3)
ON CONFLICT ("categoryId","name") DO NOTHING;

-- ============================================================================
-- Vérification
-- ============================================================================
-- SELECT c.name AS category, at.name AS attribute, at.type, array_length(at.options, 1) AS nb_options
-- FROM "AttributeTemplate" at
-- JOIN "Category" c ON c.id = at."categoryId"
-- ORDER BY c.name, at.position;
