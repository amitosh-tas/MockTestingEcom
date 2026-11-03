import express from "express";
import Stripe from "stripe";

const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

router.post("/create-checkout-session", async (req, res) => {
  const amountInRupees = Number(req.body?.amount);
  const amount = Math.round(amountInRupees * 100);
  if (!Number.isFinite(amountInRupees) || !Number.isSafeInteger(amount) || amount < 100 || amount > 10_000_000) {
    return res.status(400).json({ success: false, message: "Enter an amount from ₹1 to ₹100,000." });
  }
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ success: false, message: "Stripe test credentials are missing. Set STRIPE_SECRET_KEY in server/.env." });

  try {
    const { email, attributionToken } = req.body;
    const metadata = {};
    if (typeof attributionToken === "string" && attributionToken.length <= 500) metadata.attribution_token = attributionToken;
    const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "inr",
      customer_email: typeof email === "string" && email.trim().length > 0 && email.length <= 254 ? email.trim() : undefined,
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: { name: "Northstar integration test" },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${appUrl}/?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?stripe_cancelled=1`,
    });
    res.status(201).json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    res.status(502).json({ success: false, message: "Stripe could not create the checkout session. Check your test key and server logs." });
  }
});

router.get("/session/:sessionId", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ success: false, message: "Stripe test credentials are missing. Set STRIPE_SECRET_KEY in server/.env." });
  if (!req.params.sessionId.startsWith("cs_")) return res.status(400).json({ success: false, message: "Invalid Stripe checkout session ID." });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, { expand: ["payment_intent"] });
    if (session.payment_status !== "paid") {
      return res.status(402).json({ success: false, message: "Stripe has not marked this session as paid." });
    }
    res.json({
      success: true,
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      amount: session.amount_total,
      email: session.customer_details?.email || session.customer_email || undefined,
    });
  } catch (error) {
    console.error("Stripe session verification failed:", error);
    res.status(502).json({ success: false, message: "Unable to confirm the Stripe checkout session." });
  }
});

export default router;
