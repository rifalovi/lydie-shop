-- ============================================================================
-- Lydie'shop — Migration : vérification email obligatoire
-- ============================================================================
-- Supabase SQL Editor — un seul "Run". Idempotent.
-- ============================================================================

-- Ajouter les colonnes sur User si elles n'existent pas.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'emailVerified') THEN
    ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'verificationToken') THEN
    ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'verificationTokenExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "verificationTokenExpiry" TIMESTAMP(3);
  END IF;
END $$;

-- Index unique sur verificationToken (pour la recherche par token).
CREATE UNIQUE INDEX IF NOT EXISTS "User_verificationToken_key"
  ON "User"("verificationToken");

-- Marquer les comptes admin/super_admin existants comme vérifiés
-- (ils ont été créés avant l'existence de ce système).
UPDATE "User"
SET "emailVerified" = NOW()
WHERE role IN ('ADMIN', 'SUPER_ADMIN')
  AND "emailVerified" IS NULL;

-- ============================================================================
-- Vérification
-- ============================================================================
-- SELECT email, role, "emailVerified" IS NOT NULL AS verified
-- FROM "User"
-- ORDER BY role, email;
-- ============================================================================
