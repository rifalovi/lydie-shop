-- ============================================================================
-- Lydie'shop — Migration : ajout du rôle SUPER_ADMIN
-- ============================================================================
-- À exécuter dans Supabase SQL Editor.
--
-- ⚠ IMPORTANT : exécuter les deux blocs SÉPARÉMENT (un "Run" chacun).
-- PostgreSQL peut ajouter une valeur d'enum dans une transaction (PG12+),
-- mais la nouvelle valeur ne peut PAS être utilisée dans la même
-- transaction. Donc le ALTER TYPE et le UPDATE doivent être dans deux
-- transactions séparées.
-- ============================================================================

-- ============================================================================
-- BLOC 1 — Ajouter la valeur SUPER_ADMIN à l'enum Role
-- Cliquer "Run" sur ce bloc SEUL.
-- ============================================================================

-- IF NOT EXISTS : idempotent, ne plante pas si relancé.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';


-- ============================================================================
-- BLOC 2 — Promouvoir les 2 comptes fondateurs en SUPER_ADMIN
-- Cliquer "Run" sur ce bloc SÉPARÉMENT du bloc 1.
-- ============================================================================

-- UPDATE "User"
-- SET role = 'SUPER_ADMIN'
-- WHERE email IN ('admin@lydieshop.com', 'lydieshop993@gmail.com');
--
-- -- Vérification
-- SELECT id, email, name, role
-- FROM "User"
-- WHERE role IN ('ADMIN', 'SUPER_ADMIN')
-- ORDER BY role, email;
