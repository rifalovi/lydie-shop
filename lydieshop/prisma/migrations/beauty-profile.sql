-- ============================================================================
-- Lydie'shop — Migration : table BeautyProfile (préférences beauté)
-- ============================================================================
-- À exécuter dans Supabase SQL Editor (un seul "Run").
-- Idempotent : utilise IF NOT EXISTS partout.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "BeautyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hairType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "desiredLength" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favoriteColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budgetRange" TEXT,
    "occasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeautyProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BeautyProfile_userId_key"
    ON "BeautyProfile"("userId");

-- Le IF NOT EXISTS n'existe pas pour ALTER TABLE ADD CONSTRAINT, donc on
-- wrappe dans un DO block pour ne pas planter si relancé.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'BeautyProfile_userId_fkey'
  ) THEN
    ALTER TABLE "BeautyProfile"
      ADD CONSTRAINT "BeautyProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ============================================================================
-- Vérification
-- ============================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'BeautyProfile'
-- ORDER BY ordinal_position;
--
-- Attendu : id, userId, hairType, desiredLength, favoriteColors,
--           budgetRange, occasions, notes, updatedAt
-- ============================================================================
