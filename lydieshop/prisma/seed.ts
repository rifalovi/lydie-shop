// Seed Lydie'shop — injecte les catégories et les produits de démo.
// Usage : `npm run db:seed`

import { PrismaClient } from "@prisma/client";
import { categories } from "../lib/categories";
import { products } from "../lib/products";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Seed Lydie'shop — démarrage...");

  // Admin de démo
  const adminPassword = await bcrypt.hash("Reine2026!", 10);
  await prisma.user.upsert({
    where: { email: "admin@lydieshop.com" },
    update: {},
    create: {
      email: "admin@lydieshop.com",
      name: "Lydie Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("👑 Admin créé : admin@lydieshop.com / Reine2026!");

  // Catégories
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image },
      create: { slug: cat.slug, name: cat.name, image: cat.image },
    });
  }
  console.log(`🗂  ${categories.length} catégories insérées`);

  // Produits
  for (const p of products) {
    const category = await prisma.category.findUnique({
      where: { slug: p.categorySlug },
    });
    if (!category) continue;

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        shortDesc: p.shortDesc,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        categoryId: category.id,
        tags: p.tags,
        features: p.features,
        careInstructions: p.careInstructions,
        isFeatured: p.isFeatured,
        isNew: p.isNew ?? false,
        rating: p.rating,
        reviewCount: p.reviewCount,
      },
      create: {
        slug: p.slug,
        name: p.name,
        shortDesc: p.shortDesc,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        categoryId: category.id,
        tags: p.tags,
        features: p.features,
        careInstructions: p.careInstructions,
        isFeatured: p.isFeatured,
        isNew: p.isNew ?? false,
        rating: p.rating,
        reviewCount: p.reviewCount,
        images: {
          create: p.images.map((url, position) => ({ url, position })),
        },
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            length: v.length,
            color: v.color,
            stock: v.stock,
            price: v.price,
          })),
        },
      },
    });
  }
  console.log(`🛍  ${products.length} produits insérés`);

  // Codes promo de démo
  await prisma.promoCode.upsert({
    where: { code: "REINE10" },
    update: {},
    create: { code: "REINE10", type: "PERCENT", value: 10, isActive: true },
  });
  await prisma.promoCode.upsert({
    where: { code: "BIENVENUE" },
    update: {},
    create: { code: "BIENVENUE", type: "FIXED", value: 10, isActive: true },
  });
  console.log("🎁 Codes promo créés : REINE10, BIENVENUE");

  console.log("✨ Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
