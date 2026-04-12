-- ============================================================================
-- Lydie'shop — Migration : ShopSettings + Category.isActive/position
-- ============================================================================
-- Supabase SQL Editor — un seul "Run".
-- ============================================================================

-- Category: add isActive and position columns if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Category' AND column_name = 'isActive') THEN
    ALTER TABLE "Category" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Category' AND column_name = 'position') THEN
    ALTER TABLE "Category" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ShopSettings singleton table
CREATE TABLE IF NOT EXISTS "ShopSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "shopName" TEXT NOT NULL DEFAULT 'Lydie''shop',
    "contactEmail" TEXT NOT NULL DEFAULT 'contact@lydie-shop.fr',
    "instagramUrl" TEXT DEFAULT 'https://instagram.com/lydieshop',
    "tiktokUrl" TEXT,
    "facebookUrl" TEXT,
    "promoBarMessage" TEXT DEFAULT 'Livraison offerte dès 60€ · Cadeau surprise dans chaque commande',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT DEFAULT 'La boutique est en maintenance. Revenez bientôt !',
    "freeShippingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "colissimoPrice" DOUBLE PRECISION NOT NULL DEFAULT 5.90,
    "mondialRelayPrice" DOUBLE PRECISION NOT NULL DEFAULT 3.90,
    "chronopostPrice" DOUBLE PRECISION NOT NULL DEFAULT 12.90,
    "colissimoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mondialRelayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chronopostEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- Insert default singleton if not exists
INSERT INTO "ShopSettings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;
