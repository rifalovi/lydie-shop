import Link from "next/link";
import { Shield, BookOpen, ClipboardList } from "lucide-react";

export default function AdminIndexPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oif-blue flex items-center gap-2">
          <Shield className="w-6 h-6" /> Administration
        </h1>
        <p className="text-oif-gray-500 mt-1">
          Gérez la base de connaissances et les questionnaires générés.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/knowledge" className="card hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-oif-blue-50 text-oif-blue flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-oif-gray-700">Base de connaissances</h2>
              <p className="text-sm text-oif-gray-500 mt-1">
                Importer des référentiels PDF OIF pour enrichir l&apos;assistant.
              </p>
            </div>
          </div>
        </Link>

        <Link href="/admin/questionnaires" className="card hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-oif-blue-50 text-oif-blue flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-oif-gray-700">Questionnaires</h2>
              <p className="text-sm text-oif-gray-500 mt-1">
                Générer, modifier et activer les questionnaires ERA par projet.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
