import Link from "next/link";
import { categories } from "@/lib/categories";

export function CategoriesSection() {
  return (
    <section className="container-page py-20">
      <div className="mb-10 text-center">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Nos univers
        </p>
        <h2 className="mt-2 font-serif text-4xl md:text-5xl">
          Explorez la <span className="title-gold font-script">collection</span>
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/boutique?categorie=${cat.slug}`}
            className="group relative block overflow-hidden rounded-luxe border border-borderSoft bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="aspect-[4/5] overflow-hidden bg-rose-light">
              <img
                src={cat.image}
                alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <h3 className="font-serif text-2xl font-semibold">{cat.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-white/85">
                {cat.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-ui font-semibold uppercase tracking-widest text-gold-light">
                Découvrir →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
