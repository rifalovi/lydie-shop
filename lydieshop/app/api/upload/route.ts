import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cloudinary, CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 Mo
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
};

export async function POST(req: NextRequest) {
  // Uploads réservés aux admins — évite l'abus anonyme.
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json(
      { error: "Cloudinary n'est pas configuré." },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "FormData invalide." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Fichier manquant." },
      { status: 400 },
    );
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté (JPEG, PNG, WebP, AVIF uniquement)." },
      { status: 415 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (8 Mo max)." },
      { status: 413 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: CLOUDINARY_FOLDER,
            resource_type: "image",
            transformation: [
              { width: 1600, height: 2000, crop: "limit" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (error, res) => {
            if (error || !res) {
              reject(error ?? new Error("Upload Cloudinary échoué."));
              return;
            }
            resolve(res as CloudinaryUploadResult);
          },
        );
        stream.end(buffer);
      },
    );

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (err) {
    console.error("[/api/upload] cloudinary error", err);
    return NextResponse.json(
      { error: "Upload échoué. Réessayez." },
      { status: 500 },
    );
  }
}
