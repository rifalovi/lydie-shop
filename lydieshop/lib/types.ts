export type Category = {
  id: string;
  slug: string;
  name: string;
  image: string;
  description: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  color?: string;
  length?: string;
  stock: number;
  price?: number;
};

export type ProductAttributeDisplay = {
  name: string;
  value: string;
  unit?: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  categorySlug: string;
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  isFeatured: boolean;
  isNew?: boolean;
  rating: number;
  reviewCount: number;
  features: string[];
  careInstructions: string;
  dynamicAttributes?: ProductAttributeDisplay[];
};

export type CartLine = {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variantLabel?: string;
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  items: { name: string; quantity: number; price: number; image: string }[];
  trackingNumber?: string;
  carrier?: string;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
