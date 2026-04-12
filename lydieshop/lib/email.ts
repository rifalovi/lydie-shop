import { Resend } from "resend";
import { formatEUR } from "./format";

// Resend est instancié uniquement si la clé est présente : ainsi le build et
// le dev local fonctionnent même sans clé. Les envois seront silencieusement
// ignorés et loggés.
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Accepte EMAIL_FROM, RESEND_FROM_EMAIL, ou fallback vers le test sender
// Resend. Pour envoyer depuis un domaine custom (contact@lydie-shop.fr),
// le domaine doit être vérifié dans Resend Dashboard → Domains.
const FROM =
  process.env.EMAIL_FROM ??
  process.env.RESEND_FROM_EMAIL ??
  "Lydie'shop <onboarding@resend.dev>";

export const isResendConfigured = Boolean(apiKey);

// Génère un token de vérification — 32 octets, base64url, 43 chars.
export function generateVerificationToken(): string {
  const { randomBytes } = require("crypto") as typeof import("crypto");
  return randomBytes(32).toString("base64url");
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

async function safeSend({ to, subject, html }: SendArgs) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY manquant — email "${subject}" non envoyé à ${to}`,
    );
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] envoi échoué", err);
  }
}

const baseLayout = (title: string, body: string) => `
<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#FFF9F5;font-family:'Helvetica Neue',Arial,sans-serif;color:#3D2B35;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9F5;padding:32px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #F2E0E6;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#F8C8D4 0%,#C9A84C 100%);padding:24px;text-align:center;">
                <h1 style="margin:0;font-family:'Georgia',serif;color:#ffffff;font-size:28px;">Lydie'shop</h1>
                <p style="margin:6px 0 0;color:#FFF9F5;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${title}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 24px;font-size:15px;line-height:1.6;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="background:#FDE8EE;padding:18px;text-align:center;font-size:12px;color:#9A7A2E;">
                Lydie'shop — la boutique qui sublime les Reines 👑<br/>
                <a href="https://lydieshop.com" style="color:#9A7A2E;text-decoration:underline;">lydieshop.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export async function sendWelcomeEmail(args: { to: string; name?: string | null }) {
  const firstName = args.name?.split(" ")[0] ?? "Reine";
  const html = baseLayout(
    "Bienvenue dans le cercle",
    `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Bienvenue chez <strong>Lydie'shop</strong>, l'écrin de celles qui ne passent jamais inaperçues. ✨</p>
    <p>Pour célébrer votre arrivée, nous vous offrons <strong>10% sur votre première commande</strong> avec le code&nbsp;:</p>
    <p style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;padding:14px 28px;background:#FDE8EE;border:2px dashed #E8A0B4;border-radius:12px;font-family:monospace;font-size:18px;letter-spacing:3px;color:#3D2B35;font-weight:bold;">REINE10</span>
    </p>
    <p>Vous bénéficiez aussi de <strong>100 points Couronne offerts</strong> sur votre compte fidélité.</p>
    <p style="margin-top:28px;">Avec toute notre considération,<br/><em>L'équipe Lydie'shop</em></p>
    `,
  );
  await safeSend({
    to: args.to,
    subject: "👑 Bienvenue chez Lydie'shop — votre code -10% à l'intérieur",
    html,
  });
}

export type OrderEmailItem = {
  name: string;
  quantity: number;
  price: number;
};

export async function sendVerificationEmail(args: {
  to: string;
  name?: string | null;
  verifyUrl: string;
}) {
  const firstName = args.name?.split(" ")[0] ?? "Reine";
  const html = baseLayout(
    "Confirmez votre email",
    `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Bienvenue chez <strong>Lydie'shop</strong> ! Pour activer votre compte et profiter de votre code <strong>REINE10</strong> (-10% sur votre première commande), confirmez votre adresse email :</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${args.verifyUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#F8C8D4 0%,#C9A84C 100%);color:#ffffff;text-decoration:none;border-radius:999px;font-weight:bold;font-size:16px;">
        Confirmer mon email
      </a>
    </p>
    <p style="color:#7A6770;font-size:13px;">Si le bouton ne fonctionne pas, copiez ce lien :<br/>
      <span style="word-break:break-all;color:#9A7A2E;">${args.verifyUrl}</span>
    </p>
    <p style="margin-top:20px;color:#7A6770;font-size:13px;">Ce lien est valable <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez simplement cet email.</p>
    <p style="margin-top:24px;">L'équipe Lydie'shop</p>
    `,
  );

  await safeSend({
    to: args.to,
    subject: "Confirmez votre email — Lydie'shop 👑",
    html,
  });
}

export async function sendPasswordResetEmail(args: {
  to: string;
  customerName?: string | null;
  resetUrl: string;
}) {
  const firstName = args.customerName?.split(" ")[0] ?? "Reine";

  const html = baseLayout(
    "Réinitialisation",
    `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe sur Lydie'shop.</p>
    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong>1 heure</strong> et ne peut être utilisé qu'une seule fois.</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${args.resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#F8C8D4 0%,#C9A84C 100%);color:#ffffff;text-decoration:none;border-radius:999px;font-weight:bold;">
        Réinitialiser mon mot de passe →
      </a>
    </p>
    <p style="color:#7A6770;font-size:13px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
      <span style="word-break:break-all;color:#9A7A2E;">${args.resetUrl}</span>
    </p>
    <p style="margin-top:24px;color:#7A6770;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité — votre mot de passe ne sera pas modifié.</p>
    <p style="margin-top:24px;">L'équipe Lydie'shop</p>
    `,
  );

  await safeSend({
    to: args.to,
    subject: "🔐 Réinitialiser votre mot de passe — Lydie'shop",
    html,
  });
}

export async function sendReviewApprovedEmail(args: {
  to: string;
  customerName: string | null;
  productName: string;
  productUrl: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}) {
  const firstName = args.customerName?.split(" ")[0] ?? "Reine";
  const stars = "★".repeat(args.rating) + "☆".repeat(5 - args.rating);

  const reviewBlock = `
    <div style="margin-top:20px;padding:16px;background:#FDE8EE;border-radius:12px;border-left:4px solid #C9A84C;">
      <p style="margin:0;font-size:18px;letter-spacing:2px;color:#C9A84C;">${stars}</p>
      ${args.title ? `<p style="margin:8px 0 0;font-family:'Georgia',serif;font-size:18px;">${args.title}</p>` : ""}
      ${args.comment ? `<p style="margin:8px 0 0;color:#3D2B35;">${args.comment}</p>` : ""}
    </div>
  `;

  const html = baseLayout(
    "Avis publié",
    `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Votre avis sur <strong>${args.productName}</strong> vient d'être publié sur Lydie'shop. Merci infiniment pour votre retour — il aidera les autres Reines à faire leur choix. ✨</p>
    ${reviewBlock}
    <p style="margin-top:24px;">
      <a href="${args.productUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#F8C8D4 0%,#C9A84C 100%);color:#ffffff;text-decoration:none;border-radius:999px;font-weight:bold;">Voir votre avis →</a>
    </p>
    <p style="margin-top:24px;">En remerciement de votre partage, <strong>50 points Couronne</strong> seront crédités sur votre compte fidélité très bientôt.</p>
    <p style="margin-top:24px;">Avec toute notre gratitude,<br/><em>L'équipe Lydie'shop</em></p>
    `,
  );

  await safeSend({
    to: args.to,
    subject: `✨ Votre avis sur ${args.productName} est publié`,
    html,
  });
}

export async function sendOrderConfirmationEmail(args: {
  to: string;
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    postalCode: string;
    city: string;
    country?: string;
  };
}) {
  const itemsHtml = args.items
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F2E0E6;">${it.quantity}× ${it.name}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #F2E0E6;font-weight:bold;">${formatEUR(it.price * it.quantity)}</td>
        </tr>`,
    )
    .join("");

  const discountRow =
    args.discount && args.discount > 0
      ? `
      <tr>
        <td style="padding:4px 0;color:#9A7A2E;">Points Couronne</td>
        <td align="right" style="padding:4px 0;color:#9A7A2E;">-${formatEUR(args.discount)}</td>
      </tr>`
      : "";

  const html = baseLayout(
    "Commande confirmée",
    `
    <p>Merci pour votre commande ! 👑</p>
    <p>Votre commande <strong>${args.orderNumber}</strong> est confirmée et notre atelier la prépare avec soin. Vous recevrez un email avec votre numéro de suivi dès l'expédition (sous 24h ouvrées).</p>

    <h3 style="font-family:'Georgia',serif;color:#3D2B35;margin-top:28px;border-bottom:2px solid #C9A84C;padding-bottom:6px;">Récapitulatif</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${itemsHtml}
      <tr>
        <td style="padding:10px 0;color:#7A6770;">Sous-total</td>
        <td align="right" style="padding:10px 0;">${formatEUR(args.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#7A6770;">Livraison</td>
        <td align="right" style="padding:4px 0;">${args.shippingCost === 0 ? "Offerte" : formatEUR(args.shippingCost)}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:14px 0 0;font-size:16px;font-weight:bold;">Total</td>
        <td align="right" style="padding:14px 0 0;font-size:18px;font-weight:bold;color:#9A7A2E;">${formatEUR(args.total)}</td>
      </tr>
    </table>

    <h3 style="font-family:'Georgia',serif;color:#3D2B35;margin-top:28px;border-bottom:2px solid #C9A84C;padding-bottom:6px;">Adresse de livraison</h3>
    <p style="margin:8px 0;">
      ${args.shippingAddress.firstName} ${args.shippingAddress.lastName}<br/>
      ${args.shippingAddress.street}<br/>
      ${args.shippingAddress.postalCode} ${args.shippingAddress.city}<br/>
      ${args.shippingAddress.country ?? "France"}
    </p>

    <p style="margin-top:28px;">Avec toute notre gratitude,<br/><em>L'équipe Lydie'shop</em></p>
    `,
  );

  await safeSend({
    to: args.to,
    subject: `✨ Commande ${args.orderNumber} confirmée — Lydie'shop`,
    html,
  });
}
