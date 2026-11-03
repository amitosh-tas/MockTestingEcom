import crypto from "node:crypto";

export async function handleRazorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).send("Razorpay webhook secret is not configured");
  if (!Buffer.isBuffer(req.body)) return res.status(400).send("Expected raw JSON request body");

  const signature = req.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", secret).update(req.body).digest();
  let received;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    received = Buffer.alloc(0);
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(400).send("Invalid Razorpay webhook signature");
  }

  let eventBody;
  try {
    eventBody = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).send("Invalid JSON webhook payload");
  }

  if (eventBody.event !== "payment.captured") return res.json({ status: "ok", ignored: true });

  const payment = eventBody.payload?.payment?.entity;
  if (!payment?.id || !Number.isFinite(payment.amount)) {
    return res.status(400).send("Captured payment payload is incomplete");
  }

  const apiKey = process.env.ELYSIUM_SECRET_KEY;
  if (!apiKey) return res.status(503).send("Elysium secret key is not configured");
  const apiBaseUrl = (process.env.ELYSIUM_API_BASE_URL || "https://api.elysium.ai").replace(/\/$/, "");
  const attributionToken = payment.notes?.attribution_token || payment.notes?.checkout_token;

  try {
    const response = await fetch(`${apiBaseUrl}/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "Idempotency-Key": payment.id,
      },
      body: JSON.stringify({
        externalId: payment.id,
        ...(attributionToken ? { checkoutToken: attributionToken } : {}),
        grossAmount: payment.amount / 100,
        netAmount: payment.amount / 100,
        currency: payment.currency,
        email: payment.email || undefined,
        orderedAt: payment.created_at ? new Date(payment.created_at * 1000).toISOString() : new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      const details = await response.text();
      console.error(`Elysium order ingestion failed (${response.status}):`, details);
      return res.status(502).send("Elysium order ingestion failed; Razorpay may retry this webhook");
    }
    return res.json({ status: "ok" });
  } catch (error) {
    console.error("Elysium webhook forwarding failed:", error);
    return res.status(502).send("Could not forward captured payment to Elysium");
  }
}
