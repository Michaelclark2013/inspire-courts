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

// ── Customers + saved cards (recurring billing) ──────────────────────
// Recurring billing uses Square's Customer + Card-on-File primitives.
// Flow: client tokenizes card via Web Payments SDK → POSTs sourceId →
// we createOrGetCustomer + createCard → store square_card_id locally
// → cron charges with chargeSavedCard.

export async function createOrGetCustomer(opts: {
  email: string;
  givenName?: string;
  familyName?: string;
  phone?: string;
  externalId?: string; // our member.id stringified — for round-trip lookups
}): Promise<{ customerId: string }> {
  const client = getClient();
  // Search first to avoid duplicate customers across sign-ups.
  if (opts.email) {
    try {
      const search = await client.customers.search({
        query: { filter: { emailAddress: { exact: opts.email } } },
      });
      const existing = search.customers?.[0];
      if (existing?.id) return { customerId: existing.id };
    } catch { /* fall through to create */ }
  }
  const created = await client.customers.create({
    idempotencyKey: `cust-${opts.externalId || opts.email}-${Date.now()}`,
    emailAddress: opts.email,
    givenName: opts.givenName,
    familyName: opts.familyName,
    phoneNumber: opts.phone,
    referenceId: opts.externalId,
  });
  const id = created.customer?.id;
  if (!id) throw new Error("Square customer create returned no id");
  return { customerId: id };
}

export async function attachCardToCustomer(opts: {
  customerId: string;
  sourceId: string; // nonce from Web Payments SDK card tokenization
  cardholderName?: string;
}): Promise<{
  cardId: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
}> {
  const client = getClient();
  const res = await client.cards.create({
    idempotencyKey: `card-${opts.customerId}-${Date.now()}`,
    sourceId: opts.sourceId,
    card: {
      customerId: opts.customerId,
      cardholderName: opts.cardholderName,
    },
  });
  const card = res.card;
  if (!card?.id) throw new Error("Square card create returned no id");
  return {
    cardId: card.id,
    brand: card.cardBrand?.toString(),
    last4: card.last4,
    expMonth: card.expMonth ? Number(card.expMonth) : undefined,
    expYear: card.expYear ? Number(card.expYear) : undefined,
  };
}

export async function chargeSavedCard(opts: {
  customerId: string;
  cardId: string;
  amountCents: number;
  idempotencyKey: string;
  note?: string;
}): Promise<{
  ok: boolean;
  paymentId?: string;
  receiptUrl?: string;
  failureCode?: string;
  failureMessage?: string;
}> {
  const client = getClient();
  try {
    const res = await client.payments.create({
      idempotencyKey: opts.idempotencyKey,
      sourceId: opts.cardId,
      customerId: opts.customerId,
      locationId,
      amountMoney: {
        amount: BigInt(opts.amountCents),
        currency: "USD",
      },
      note: opts.note,
      autocomplete: true,
    });
    const p = res.payment;
    if (p?.status === "COMPLETED" && p?.id) {
      return { ok: true, paymentId: p.id, receiptUrl: p.receiptUrl };
    }
    return {
      ok: false,
      failureCode: p?.status || "UNKNOWN",
      failureMessage: `Payment did not complete (status=${p?.status})`,
    };
  } catch (err: unknown) {
    // Square SDK errors have a `.errors` array with code + detail.
    const e = err as { errors?: Array<{ code?: string; detail?: string }> ; message?: string };
    const first = e.errors?.[0];
    return {
      ok: false,
      failureCode: first?.code || "UNKNOWN",
      failureMessage: first?.detail || e.message || "Charge failed",
    };
  }
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
