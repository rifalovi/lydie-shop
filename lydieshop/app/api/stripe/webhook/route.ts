import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe envoie le payload brut signé — il NE FAUT PAS le parser en JSON.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Signature ou secret manquant." },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature invalide", err);
    return NextResponse.json(
      { error: "Signature invalide." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED", paymentStatus: "FAILED" },
          });
        }
        break;
      }
      default:
        // Pas d'action requise pour les autres événements.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    return NextResponse.json(
      { error: "Erreur de traitement." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("[stripe webhook] orderId manquant dans metadata");
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    console.warn(`[stripe webhook] commande ${orderId} introuvable`);
    return;
  }

  // Idempotence : si déjà payée, ne rien refaire.
  if (order.paymentStatus === "PAID") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentIntent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : order.paymentIntent,
      },
    });

    // Décrément du stock par produit (les variantes resteront pour Phase 2).
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  // Email de confirmation — best effort, ne fait pas échouer le webhook.
  const customerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    order.guestEmail ??
    null;

  if (customerEmail) {
    const address = order.shippingAddress as {
      firstName: string;
      lastName: string;
      street: string;
      postalCode: string;
      city: string;
      country?: string;
    };

    sendOrderConfirmationEmail({
      to: customerEmail,
      orderNumber: order.orderNumber,
      items: order.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        price: Number(it.price),
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: address,
    }).catch((e) => console.error("[stripe webhook] email error", e));
  }
}
