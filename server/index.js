
import "dotenv/config";

import express from "express";
import cors from "cors";

import paymentRoutes from "./routes/payment.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import { handleRazorpayWebhook } from "./routes/razorpayWebhook.js";

const app = express();

const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  "https://moch-test-ecom.vercel.app",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim()) : []),
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
// Razorpay signatures are calculated from the exact raw request bytes.
app.post("/api/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }), handleRazorpayWebhook);
app.use(express.json());

app.use("/api/payment", paymentRoutes);
app.use("/api/stripe", stripeRoutes);

app.get("/", (req, res) => {
  res.send("Payment server is running!");
});

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
