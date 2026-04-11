import { StarRating } from "@/components/ui/StarRating";

const testimonials = [
  {
    name: "Aminata D.",
    city: "Paris",
    rating: 5,
    comment:
      "J'ai reçu ma perruque Majesté en 2 jours. La qualité est au-delà de mes attentes, et l'emballage est une vraie expérience. Je me suis sentie comme une reine.",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80",
  },
  {
    name: "Sarah B.",
    city: "Lyon",
    rating: 5,
    comment:
      "Service client au top. J'ai échangé avec Lydie (le chatbot) qui m'a aidée à choisir ma longueur. Je vais devenir cliente fidèle !",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80",
  },
  {
    name: "Priscillia N.",
    city: "Bruxelles",
    rating: 5,
    comment:
      "La Diva body wave est magnifique. Les ondulations tiennent, les reflets miel sont sublimes. J'ai reçu tellement de compliments.",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&q=80",
  },
];

export function Testimonials() {
  return (
    <section className="container-page py-20">
      <div className="mb-12 text-center">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Elles en parlent
        </p>
        <h2 className="mt-2 font-serif text-4xl md:text-5xl">
          La parole aux{" "}
          <span className="title-gold font-script">Reines</span>
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <blockquote
            key={t.name}
            className="card-luxe flex flex-col p-6"
          >
            <StarRating value={t.rating} />
            <p className="mt-4 flex-1 font-serif text-lg italic leading-relaxed text-ink">
              « {t.comment} »
            </p>
            <footer className="mt-6 flex items-center gap-3 border-t border-borderSoft pt-4">
              <img
                src={t.avatar}
                alt={t.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="font-ui font-bold text-ink">{t.name}</p>
                <p className="text-xs text-ink-muted">{t.city}</p>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
