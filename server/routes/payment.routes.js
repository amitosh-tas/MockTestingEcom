import express from "express";
import Razorpay from "razorpay";
import crypto from "node:crypto";

const router = express.Router();

function getRazorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

router.post("/create-order", async (req, res) => {
  const amountInRupees = Number(req.body?.amount);
  const amount = Math.round(amountInRupees * 100);
  if (!Number.isFinite(amountInRupees) || !Number.isSafeInteger(amount) || amount < 100 || amount > 10_000_000) {
    return res.status(400).json({ success: false, message: "Enter an amount from ₹1 to ₹100,000." });
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.status(503).json({ success: false, message: "Razorpay test credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env." });
  }

  try {
    const { email, attributionToken } = req.body;
    const notes = {};
    if (typeof email === "string" && email.length <= 254) notes.customer_email = email;
    if (typeof attributionToken === "string" && attributionToken.length <= 255) notes.attribution_token = attributionToken;
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `test_${Date.now()}`,
      notes,
    });
    res.status(201).json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, order });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    res.status(502).json({ success: false, message: "Razorpay could not create the order. Check your test credentials and server logs." });
  }
});

router.post("/verify", (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body ?? {};
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ success: false, message: "Razorpay test credentials are not configured on the server." });
  if (![orderId, paymentId, signature].every((value) => typeof value === "string" && value.length > 0)) {
    return res.status(400).json({ success: false, message: "Razorpay returned incomplete payment details." });
  }

  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  let received;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    received = Buffer.alloc(0);
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(400).json({ success: false, message: "Payment signature check failed. This payment was not verified." });
  }
  res.json({ success: true, paymentId });
});

export default router;
