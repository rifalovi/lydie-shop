import { v2 as cloudinary } from "cloudinary";

// Accept both CLOUDINARY_* (standard server-side) and NEXT_PUBLIC_CLOUDINARY_*
// (what users often set on Vercel thinking it's needed for the client).
// Either works — the upload only runs server-side via /api/upload anyway.
const cloud_name =
  process.env.CLOUDINARY_CLOUD_NAME ??
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const api_key =
  process.env.CLOUDINARY_API_KEY ??
  process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const api_secret =
  process.env.CLOUDINARY_API_SECRET ??
  process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true,
});

export { cloudinary };

export const CLOUDINARY_FOLDER = "lydieshop/products";

export const isCloudinaryConfigured = Boolean(
  cloud_name && api_key && api_secret,
);
