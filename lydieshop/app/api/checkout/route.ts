import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { authOptions } from "@/lib/auth";
import { computeShipping, SHIPPING, type ShippingMethodId } from "@/lib/shipping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive().max(20),
});

const AddressSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  street: z.string().min(1).max(200),
  postalCode: z.string().min(1).max(20),
  city: z.string().min(1).max(80),
  country: z.string().max(2).default("FR"),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1).max(20),
  shippingMethod: z.enum(["COLISSIMO", "MONDIAL_RELAY", "CHRONOPOST"]),
  address: AddressSchema,
});

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `LYD-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { items, shippingMethod, address } = parsed.data;

  // Recharge les produits depuis la DB pour ne JAMAIS faire confiance au prix
  // envoyé par le client.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    include: { variants: true, images: { orderBy: { position: "asc" } } },
  });

  const lineItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Produit introuvable : ${item.productId}`);
    }

    let unitPrice = Number(product.price);
    let variantLabel: string | null = null;

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variante introuvable : ${item.variantId}`);
      }
      if (variant.price) unitPrice = Number(variant.price);
      variantLabel = variant.name;
    }

    return {
      product,
      variantId: item.variantId ?? null,
      variantLabel,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const subtotal = lineItems.reduce((acc, l) => acc + l.lineTotal, 0);
  const shippingCost = computeShipping(subtotal, shippingMethod);
  const total = subtotal + shippingCost;

  const session = await getServerSession(authOptions);
  const orderNumber = generateOrderNumber();

  // Création de la commande en PENDING — sera passée à PAID par le webhook.
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session?.user?.id ?? null,
      guestEmail: session?.user?.id ? null : address.email,
      status: "PENDING",
      paymentStatus: "PENDING",
      subtotal,
      shippingCost,
      discount: 0,
      total,
      shippingAddress: address,
      carrier: SHIPPING[shippingMethod].label,
      items: {
        create: lineItems.map((l) => ({
          productId: l.product.id,
          variantId: l.variantId,
          quantity: l.quantity,
          price: l.unitPrice,
          name: l.variantLabel
            ? `${l.product.name} — ${l.variantLabel}`
            : l.product.name,
          image: l.product.images[0]?.url ?? null,
        })),
      },
    },
  });

  const appUrl =
    process.env.NEXTAUTH_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  // Construction des line items Stripe (en centimes).
  const stripeLineItems: Array<{
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; images?: string[] };
    };
    quantity: number;
  }> = lineItems.map((l) => ({
    price_data: {
      currency: "eur",
      unit_amount: Math.round(l.unitPrice * 100),
      product_data: {
        name: l.variantLabel
          ? `${l.product.name} — ${l.variantLabel}`
          : l.product.name,
        images: l.product.images[0]?.url ? [l.product.images[0].url] : undefined,
      },
    },
    quantity: l.quantity,
  }));

  if (shippingCost > 0) {
    stripeLineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: Math.round(shippingCost * 100),
        product_data: { name: `Livraison — ${SHIPPING[shippingMethod].label}` },
      },
      quantity: 1,
    });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: address.email,
      line_items: stripeLineItems,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        shippingMethod: shippingMethod satisfies ShippingMethodId,
      },
      success_url: `${appUrl}/checkout/confirmation?orderNumber=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?cancelled=1`,
    });

    // On garde l'ID de session pour pouvoir l'attacher à la commande.
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentIntent: checkoutSession.id },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    console.error("[/api/checkout] stripe error", err);
    // Annule la commande pending si Stripe a échoué — évite les fantômes.
    await prisma.order
      .update({ where: { id: order.id }, data: { status: "CANCELLED" } })
      .catch(() => {});
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement." },
      { status: 500 },
    );
  }
}
