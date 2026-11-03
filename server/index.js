
import "dotenv/config";

import express from "express";
import cors from "cors";

import paymentRoutes from "./routes/payment.routes.js";
// import stripeRoutes from "./routes/stripe.routes.js"; // Stripe is paused for now.
import { handleRazorpayWebhook } from "./routes/razorpayWebhook.js";

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Handle browser preflights explicitly before API routes and body parsing.
app.options(/.*/, cors(corsOptions));
// Razorpay signatures are calculated from the exact raw request bytes.
app.post("/api/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }), handleRazorpayWebhook);
app.use(express.json());

app.use("/api/payment", paymentRoutes);
// app.use("/api/stripe", stripeRoutes); // Re-enable when Stripe work resumes.

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
