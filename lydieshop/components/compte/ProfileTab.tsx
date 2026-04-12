"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, Save, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  name: string | null;
  email: string;
  phone: string | null;
};

export function ProfileTab({ name, email, phone }: Props) {
  // ── Profil ──
  const [formName, setFormName] = useState(name ?? "");
  const [formPhone, setFormPhone] = useState(phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const saveProfile = async () => {
    setSaving(true);
    setProfileError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), phone: formPhone.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setProfileError(d?.error ?? "Erreur.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Mot de passe ──
  const [showPw, setShowPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const changePassword = async () => {
    setPwErr(null);
    setPwMsg(null);
    if (newPw.length < 8) { setPwErr("8 caractères minimum."); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setPwErr(d?.error ?? "Erreur."); return; }
      setPwMsg("Mot de passe modifié.");
      setCurrentPw("");
      setNewPw("");
      setShowPw(false);
    } finally {
      setPwLoading(false);
    }
  };

  // ── Suppression ──
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const deleteAccount = async () => {
    setDelErr(null);
    if (!deletePw) { setDelErr("Entrez votre mot de passe pour confirmer."); return; }
    setDelLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePw }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setDelErr(d?.error ?? "Erreur."); return; }
      signOut({ callbackUrl: "/" });
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profil */}
      <section className="card-luxe p-6">
        <h3 className="font-serif text-xl">Informations personnelles</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Nom complet" value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input label="Téléphone" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
          <Input label="Email" value={email} disabled className="sm:col-span-2 opacity-60" hint="L'email ne peut pas être modifié." />
        </div>
        {profileError && <p className="mt-3 rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{profileError}</p>}
        {saved && <p className="mt-3 rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">Profil enregistré.</p>}
        <Button className="mt-4" onClick={saveProfile} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </section>

      {/* Mot de passe */}
      <section className="card-luxe p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl">Mot de passe</h3>
          <button onClick={() => setShowPw(!showPw)} className="text-sm font-ui font-semibold text-rose-dark hover:underline">
            <KeyRound className="mr-1 inline h-4 w-4" />
            {showPw ? "Annuler" : "Modifier"}
          </button>
        </div>
        {showPw && (
          <div className="mt-4 space-y-3">
            <Input label="Mot de passe actuel" type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            <Input label="Nouveau mot de passe" type="password" autoComplete="new-password" hint="8 caractères minimum" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            {pwErr && <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{pwErr}</p>}
            {pwMsg && <p className="rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">{pwMsg}</p>}
            <Button onClick={changePassword} disabled={pwLoading}>
              {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Changer le mot de passe
            </Button>
          </div>
        )}
      </section>

      {/* Suppression */}
      <section className="card-luxe border-rose-dark/30 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-rose-dark">Supprimer mon compte</h3>
          <button onClick={() => setShowDelete(!showDelete)} className="text-sm font-ui font-semibold text-rose-dark hover:underline">
            <Trash2 className="mr-1 inline h-4 w-4" />
            {showDelete ? "Annuler" : "Supprimer"}
          </button>
        </div>
        {showDelete && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-soft bg-rose-light/40 p-3 text-sm text-rose-dark">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Cette action est <strong>irréversible</strong>. Toutes vos données personnelles, adresses et favoris seront supprimés. Vos commandes resteront archivées pour le suivi.</p>
            </div>
            <Input label="Confirmez avec votre mot de passe" type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} />
            {delErr && <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">{delErr}</p>}
            <Button variant="secondary" onClick={deleteAccount} disabled={delLoading} className="!border-rose-dark !text-rose-dark">
              {delLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Supprimer définitivement mon compte
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
