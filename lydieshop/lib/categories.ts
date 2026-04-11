import type { Category } from "./types";

export const categories: Category[] = [
  {
    id: "cat-perruques",
    slug: "perruques",
    name: "Perruques",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    description:
      "Perruques naturelles et synthétiques de qualité premium, pour un style sans compromis.",
  },
  {
    id: "cat-tissages",
    slug: "tissages",
    name: "Tissages",
    image:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80",
    description:
      "Tissages 100% cheveux naturels, coupes signature et longueurs sur mesure.",
  },
  {
    id: "cat-accessoires",
    slug: "accessoires",
    name: "Accessoires",
    image:
      "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80",
    description:
      "Bonnets, colles, peignes, sprays et soins — l'essentiel pour sublimer chaque perruque.",
  },
  {
    id: "cat-cadeaux",
    slug: "cadeaux",
    name: "Cadeaux",
    image:
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80",
    description:
      "Coffrets cadeaux pensés pour les Reines, à offrir ou à s'offrir.",
  },
];

export const getCategoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);
