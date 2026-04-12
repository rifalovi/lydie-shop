import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AttributesClient } from "./AttributesClient";

export const dynamic = "force-dynamic";

export default async function CategoryAttributesPage({
  params,
}: {
  params: { id: string };
}) {
  const category = await prisma.category.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, slug: true },
  });
  if (!category) notFound();

  const templates = await prisma.attributeTemplate.findMany({
    where: { categoryId: category.id },
    orderBy: { position: "asc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Catégorie : {category.name}
        </p>
        <h1 className="mt-1 font-serif text-4xl">Attributs</h1>
        <p className="mt-2 text-ink-muted">
          Les attributs définissent les caractéristiques techniques affichées sur la fiche produit.
        </p>
      </div>
      <AttributesClient
        categoryId={category.id}
        initialTemplates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          unit: t.unit,
          options: t.options,
          isRequired: t.isRequired,
          position: t.position,
        }))}
      />
    </div>
  );
}
