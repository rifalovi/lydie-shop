"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("coordonnateur");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        role,
      });
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-oif-blue to-oif-blue-light px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-oif-blue font-bold text-2xl">SCS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Assistant SCS</h1>
          <p className="text-oif-blue-100 text-sm mt-1">Créer votre compte</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-oif-blue mb-6">Inscription</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label-field">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Prénom Nom"
                required
              />
            </div>
            <div>
              <label className="label-field">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label className="label-field">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 6 caractères"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="label-field">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
              >
                <option value="coordonnateur">Coordonnateur de projet</option>
                <option value="charge_se">Chargé de S&amp;E</option>
                <option value="responsable">Responsable de programme</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-sm text-oif-gray-500 text-center mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-oif-blue-light font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
