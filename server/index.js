
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
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim().replace(/\/$/, "")) : []),
];

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (health checks, webhooks, curl) are not
    // subject to browser CORS checks. Browser origins must match the allowlist.
    if (!origin || allowedOrigins.some((allowed) =>
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    )) {
      return callback(null, true);
    }
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
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
