import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";

// ── Square client singleton ────────────────────────────────────────────────

const accessToken = process.env.SQUARE_ACCESS_TOKEN || "";
const locationId = process.env.SQUARE_LOCATION_ID || "";
const environment =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

let _client: SquareClient | null = null;

function getClient(): SquareClient {
  if (!_client) {
    _client = new SquareClient({ token: accessToken, environment });
  }
  return _client;
}

export function isSquareConfigured(): boolean {
  return Boolean(accessToken && locationId);
}

// ── Create a payment link for tournament registration ──────────────────────

export async function createCheckoutLink(opts: {
  amountCents: number;
  tournamentName: string;
  teamName: string;
  registrationId: number;
  redirectUrl: string;
}): Promise<{ checkoutUrl: string; orderId: string }> {
  const { amountCents, tournamentName, teamName, registrationId, redirectUrl } =
    opts;

  const client = getClient();

  const response = await client.checkout.paymentLinks.create({
    idempotencyKey: `reg-${registrationId}-${Date.now()}`,
    quickPay: {
      name: `${tournamentName} — ${teamName}`,
      priceMoney: {
        amount: BigInt(amountCents),
        currency: "USD",
      },
      locationId,
    },
    paymentNote: `Registration #${registrationId}`,
    checkoutOptions: {
      redirectUrl,
    },
    prePopulatedData: {},
  });

  const link = response.paymentLink;
  if (!link?.url || !link?.orderId) {
    throw new Error("Square did not return a payment link");
  }

  return { checkoutUrl: link.url, orderId: link.orderId };
}

// ── Verify Square webhook signature ────────────────────────────────────────

const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  url: string
): Promise<boolean> {
  if (!webhookSignatureKey) return false;

  return WebhooksHelper.verifySignature({
    requestBody: body,
    signatureHeader: signature,
    signatureKey: webhookSignatureKey,
    notificationUrl: url,
  });
}
