import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Catalogue
        </p>
        <h1 className="mt-1 font-serif text-4xl">Nouveau produit</h1>
        <p className="mt-2 text-ink-muted">
          L&apos;IA rédige la fiche à votre place — vous gardez la main sur
          chaque détail.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
