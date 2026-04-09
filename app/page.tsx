import Link from "next/link";
import { BookOpen, BarChart3, Target, FileSearch, MessageCircle } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Formation GAR/S&E",
    description: "Parcours de formation interactif sur la Gestion Axée sur les Résultats et le Suivi-Évaluation.",
  },
  {
    icon: Target,
    title: "Incubation de projet",
    description: "Construisez votre dossier GAR complet en 6 étapes guidées avec l'assistance de l'IA.",
  },
  {
    icon: BarChart3,
    title: "Indicateurs SMART",
    description: "Générez et validez des indicateurs conformes au Référentiel SSE OIF.",
  },
  {
    icon: FileSearch,
    title: "Analyse ERA",
    description: "Importez et analysez vos données ERA selon les critères CAD/OCDE.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-oif-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-oif-blue font-bold text-lg">SCS</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Assistant SCS</h1>
              <p className="text-xs text-oif-blue-100">Organisation Internationale de la Francophonie</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-oif-blue-100 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link href="/signup" className="bg-white text-oif-blue px-4 py-2 rounded-lg text-sm font-medium hover:bg-oif-blue-50 transition-colors">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-oif-blue to-oif-blue-light text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Votre assistant en Suivi-Évaluation
          </h2>
          <p className="text-xl text-oif-blue-100 mb-8 max-w-2xl mx-auto">
            Plateforme de formation et d&apos;aide opérationnelle en GAR/S&amp;E pour les coordonnateurs de projets OIF.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="bg-white text-oif-blue px-8 py-3 rounded-lg font-semibold hover:bg-oif-blue-50 transition-colors">
              Commencer
            </Link>
            <Link href="/login" className="border border-white/40 text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-oif-blue text-center mb-12">
          Quatre modules pour vous accompagner
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card hover:shadow-md transition-shadow">
              <feature.icon className="w-10 h-10 text-oif-blue-light mb-4" />
              <h4 className="font-semibold text-oif-blue mb-2">{feature.title}</h4>
              <p className="text-sm text-oif-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chatbot CTA */}
      <section className="bg-oif-blue-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <MessageCircle className="w-12 h-12 text-oif-blue-light mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-oif-blue mb-3">
            Un chatbot expert à votre service
          </h3>
          <p className="text-oif-gray-500 mb-6">
            Posez vos questions sur la GAR, le S&amp;E, les indicateurs SMART ou l&apos;analyse ERA.
            L&apos;Assistant SCS vous guide à chaque étape.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-oif-blue text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-oif-blue-100">
            © {new Date().getFullYear()} Assistant SCS — Service de Conception et de Suivi des projets — OIF
          </p>
        </div>
      </footer>
    </div>
  );
}
