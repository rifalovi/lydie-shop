import type { Product } from "./types";

// Catalogue d'amorçage — en production, ces données proviendront de Prisma.
// Ces produits sont suffisants pour parcourir la boutique, le panier et le checkout.

export const products: Product[] = [
  {
    id: "p-majeste-noir",
    slug: "perruque-majeste-noir-naturel",
    name: "Perruque Majesté — Noir Naturel",
    shortDesc: "Lace frontale 13x4, 100% cheveux naturels, 18 pouces.",
    description:
      "La Majesté, c'est le port de tête d'une Reine. Confectionnée à la main avec 100% cheveux naturels Remy, cette perruque lace frontale 13x4 épouse parfaitement votre front pour un rendu invisible. Le 18 pouces tombe délicatement sur les épaules et encadre le visage avec élégance. Préplumée, blanchie aux nœuds, prête à porter dès déballage.",
    price: 249,
    comparePrice: 299,
    stock: 12,
    categorySlug: "perruques",
    images: [
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=900&q=80",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=900&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80",
    ],
    variants: [
      { id: "v-majeste-16", name: "16 pouces", length: "16\"", stock: 4 },
      { id: "v-majeste-18", name: "18 pouces", length: "18\"", stock: 5 },
      { id: "v-majeste-20", name: "20 pouces", length: "20\"", stock: 3 },
    ],
    tags: ["bestseller", "lace-frontal", "naturel"],
    isFeatured: true,
    isNew: false,
    rating: 4.9,
    reviewCount: 128,
    features: [
      "100% cheveux humains Remy",
      "Lace HD 13x4 transparent",
      "Densité 180%",
      "Préplumée, prête à porter",
      "Teinture et décoloration possibles",
    ],
    careInstructions:
      "Lavez avec un shampoing sans sulfate tous les 10-14 jours. Appliquez un masque hydratant. Séchez à l'air libre et démêlez délicatement à partir des pointes.",
  },
  {
    id: "p-diva-body",
    slug: "perruque-diva-body-wave-miel",
    name: "Perruque Diva — Body Wave Miel",
    shortDesc: "Ondulations body wave, reflets miel, 20 pouces.",
    description:
      "La Diva illumine chaque entrée. Ses ondulations body wave parfaitement dessinées et son balayage miel ensoleillé apportent du volume et une lumière incomparable à votre silhouette. Une perruque qui se remarque, pour celles qui ne passent jamais inaperçues.",
    price: 289,
    stock: 7,
    categorySlug: "perruques",
    images: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=900&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80",
    ],
    variants: [
      { id: "v-diva-18", name: "18 pouces", length: "18\"", stock: 3 },
      { id: "v-diva-22", name: "22 pouces", length: "22\"", stock: 4 },
    ],
    tags: ["nouveau", "body-wave", "balayage"],
    isFeatured: true,
    isNew: true,
    rating: 4.8,
    reviewCount: 54,
    features: [
      "Cheveux humains Remy",
      "Balayage miel haute définition",
      "Lace frontale 13x6",
      "Ondulations longue durée",
    ],
    careInstructions:
      "Utilisez un après-shampoing hydratant et un spray thermoprotecteur avant coiffage. Ravivez les boucles avec un diffuseur.",
  },
  {
    id: "p-impératrice-kinky",
    slug: "perruque-imperatrice-kinky-curl",
    name: "Perruque Impératrice — Kinky Curl",
    shortDesc: "Boucles afro naturelles, full lace, 16 pouces.",
    description:
      "L'Impératrice célèbre les courbes et les textures naturelles. Ses boucles kinky curl rebondissantes offrent un volume spectaculaire et un style authentique. Full lace pour un confort total et une liberté de coiffage absolue.",
    price: 319,
    comparePrice: 369,
    stock: 5,
    categorySlug: "perruques",
    images: [
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&q=80",
      "https://images.unsplash.com/photo-1507101105822-7472b28e22ac?w=900&q=80",
    ],
    variants: [
      { id: "v-imp-14", name: "14 pouces", length: "14\"", stock: 2 },
      { id: "v-imp-16", name: "16 pouces", length: "16\"", stock: 3 },
    ],
    tags: ["full-lace", "kinky-curl", "premium"],
    isFeatured: true,
    isNew: false,
    rating: 5.0,
    reviewCount: 76,
    features: [
      "Full lace 360°",
      "Cheveux vierges non traités",
      "Densité 200%",
      "Texture kinky curl authentique",
    ],
    careInstructions:
      "Pulvérisez un mélange eau + leave-in tous les matins. Démêlez humide à la main. Évitez les produits à base d'huile minérale.",
  },
  {
    id: "p-tissage-straight",
    slug: "tissage-soie-royal-straight",
    name: "Tissage Soie Royal — Straight",
    shortDesc: "Cheveux naturels lisses, 3 bundles, 20 pouces.",
    description:
      "Un tissage d'une fluidité incomparable. Trois bundles de cheveux naturels lissés à la perfection, pour un rendu soyeux digne des plus grands défilés. Se teint et se coiffe selon vos envies.",
    price: 189,
    stock: 20,
    categorySlug: "tissages",
    images: [
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=900&q=80",
    ],
    variants: [
      { id: "v-tiss-16", name: "16 pouces", length: "16\"", stock: 8 },
      { id: "v-tiss-20", name: "20 pouces", length: "20\"", stock: 7 },
      { id: "v-tiss-24", name: "24 pouces", length: "24\"", stock: 5 },
    ],
    tags: ["tissage", "straight", "bundles"],
    isFeatured: true,
    isNew: false,
    rating: 4.7,
    reviewCount: 203,
    features: [
      "3 bundles de 100g",
      "Cheveux Remy vierges",
      "Finition soyeuse longue durée",
      "Compatible coloration",
    ],
    careInstructions:
      "Lavez 1 fois par semaine. Utilisez une huile légère sur les pointes après le séchage.",
  },
  {
    id: "p-bonnet-wig-grip",
    slug: "bonnet-wig-grip-velours",
    name: "Bonnet Wig Grip Velours",
    shortDesc: "Bonnet antidérapant en velours rose poudré.",
    description:
      "Un essentiel pour sécuriser votre perruque toute la journée, sans compromettre le confort. Son toucher velours doux et son rose poudré signature font de lui un accessoire aussi utile qu'élégant.",
    price: 14.9,
    stock: 80,
    categorySlug: "accessoires",
    images: [
      "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=900&q=80",
    ],
    variants: [],
    tags: ["accessoire", "bestseller"],
    isFeatured: false,
    isNew: false,
    rating: 4.6,
    reviewCount: 412,
    features: [
      "Velours doux antidérapant",
      "Réglable — taille unique",
      "Lavable en machine à froid",
    ],
    careInstructions: "Lavage machine 30°C, séchage à plat.",
  },
  {
    id: "p-coffret-reine",
    slug: "coffret-reine-d-un-jour",
    name: "Coffret Reine d'un Jour",
    shortDesc: "Coffret cadeau : soin + bonnet + peigne doré.",
    description:
      "Un coffret somptueux à offrir à celle qui règne sur votre cœur (ou à vous-même, vous le méritez). Un soin cheveux, un bonnet velours et un peigne doré, présentés dans un écrin rose et or.",
    price: 49,
    comparePrice: 69,
    stock: 25,
    categorySlug: "cadeaux",
    images: [
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=900&q=80",
    ],
    variants: [],
    tags: ["cadeau", "coffret", "promo"],
    isFeatured: true,
    isNew: true,
    rating: 4.9,
    reviewCount: 38,
    features: [
      "Soin hydratant 100ml",
      "Bonnet wig grip velours",
      "Peigne métal doré",
      "Écrin rose et or",
    ],
    careInstructions: "Voir les instructions de chaque produit à l'intérieur.",
  },
];

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const getFeaturedProducts = () => products.filter((p) => p.isFeatured);

export const getProductsByCategory = (categorySlug: string) =>
  products.filter((p) => p.categorySlug === categorySlug);

export const getRelatedProducts = (productId: string, limit = 4) => {
  const source = products.find((p) => p.id === productId);
  if (!source) return [];
  return products
    .filter(
      (p) => p.id !== productId && p.categorySlug === source.categorySlug,
    )
    .slice(0, limit);
};
