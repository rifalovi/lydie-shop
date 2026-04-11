"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

export type UploadedImage = {
  url: string;
  publicId: string;
};

type Props = {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
};

export function ImageDropzone({ value, onChange, maxImages = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setError(null);
      const slotsLeft = Math.max(0, maxImages - value.length);
      if (slotsLeft === 0) {
        setError(`Maximum ${maxImages} images.`);
        return;
      }
      const toUpload = files.slice(0, slotsLeft);
      setUploading((u) => u + toUpload.length);

      const results: UploadedImage[] = [];
      for (const file of toUpload) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) {
            setError(data?.error ?? "Upload échoué.");
            continue;
          }
          results.push({ url: data.url, publicId: data.publicId });
        } catch (err) {
          console.error(err);
          setError("Erreur réseau pendant l'upload.");
        } finally {
          setUploading((u) => u - 1);
        }
      }

      if (results.length > 0) {
        onChange([...value, ...results]);
      }
    },
    [value, onChange, maxImages],
  );

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length > 0) void uploadFiles(files);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) void uploadFiles(files);
    // Reset pour pouvoir re-sélectionner le même fichier si besoin
    e.target.value = "";
  };

  const remove = (publicId: string) => {
    onChange(value.filter((img) => img.publicId !== publicId));
  };

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-luxe border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? "border-rose-dark bg-rose-light"
            : "border-borderSoft bg-gradient-rose-soft hover:border-rose-dark"
        }`}
      >
        <Upload className="h-8 w-8 text-rose-dark" />
        <p className="mt-3 font-ui text-sm font-semibold text-ink">
          Glissez-déposez vos photos ici
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          ou cliquez pour parcourir — JPEG, PNG, WebP, 8 Mo max · {value.length}
          /{maxImages}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </label>

      {error && (
        <p className="mt-3 rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
          {error}
        </p>
      )}

      {(value.length > 0 || uploading > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {value.map((img, i) => (
            <div
              key={img.publicId}
              className="group relative aspect-[3/4] overflow-hidden rounded-luxe border border-borderSoft bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Upload ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(img.publicId)}
                aria-label="Supprimer"
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-dark shadow-soft transition-all hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-ui font-bold text-white">
                  Principale
                </span>
              )}
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="flex aspect-[3/4] items-center justify-center rounded-luxe border-2 border-dashed border-borderSoft bg-cream"
            >
              <div className="flex flex-col items-center gap-2 text-rose-dark">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs font-ui font-semibold">
                  Upload...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && uploading === 0 && (
        <p className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
          <ImageIcon className="h-4 w-4" />
          La première image sera utilisée comme image principale.
        </p>
      )}
    </div>
  );
}
