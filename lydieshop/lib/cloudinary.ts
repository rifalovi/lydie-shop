import { v2 as cloudinary } from "cloudinary";

// Configuration une seule fois au chargement du module.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const CLOUDINARY_FOLDER = "lydieshop/products";
