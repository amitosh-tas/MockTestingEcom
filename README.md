# Payment checkout test playground

A small storefront for checking the Razorpay **test mode** flow, plus a browser panel for exercising Elysium's core SDK methods. Razorpay payment signatures are verified server-side. Razorpay options are passed through the Elysium gateway wrapper, which attaches the checkout token and records payment attempts. A signed Razorpay `payment.captured` webhook forwards captured payments to Elysium from the server. Stripe is paused for now.

## Run locally

1. Create `server/.env` from `server/.env.example`. Enter your Razorpay **test** Key ID and Key Secret, Razorpay webhook secret, and Elysium server secret. Keep all secret keys on the server. Set `APP_URL` to your Vite URL if it differs from `http://localhost:5173`.
2. In one terminal, start the API:

   ```sh
   cd server
   npm install
   npm run dev
   ```

3. In another terminal, start the storefront from the project root:

   ```sh
   npm install
   npm run dev
   ```

4. Open the Vite URL printed in the terminal and enter an amount. Use Razorpay's test payment details; this page is configured for test payments and does not capture real funds.

The Vite development server proxies `/api` to `http://localhost:5000`. The checkout validates an amount of ₹1–₹100,000 and charges in INR. Razorpay success is shown only after the backend verifies its HMAC signature.

## Razorpay webhook

Expose the API server to Razorpay using a public HTTPS tunnel during local development, then configure a Razorpay test-mode webhook pointing to `https://<your-public-host>/api/webhooks/razorpay`. Subscribe to `payment.captured`, set the same webhook secret in `RAZORPAY_WEBHOOK_SECRET`, and restart the server. The endpoint verifies the HMAC using the original raw request bytes, then forwards the captured payment to Elysium with `ELYSIUM_SECRET_KEY`. It uses the Razorpay payment ID as the external order ID and idempotency key. The browser success callback is only a checkout response; the webhook is the server-side conversion ingestion path.

## Elysium core tools

Open **Attribution tools** below the checkout to try manual touch recording, visitor identification, checkout token/session creation, visitor ID read/update, test order and booking ingestion, and runtime debug configuration. Automatic initialization and pageview tracking run when the storefront loads. The manual order/booking actions send real SDK requests to the configured Elysium API, so use test data.

## Attribution

`elysium.config.js` initializes the Elysium browser SDK with its publishable key. At checkout, the app attempts to identify the visitor, requests a checkout token, and sends it in Razorpay `notes.attribution_token`. Attribution failures do not prevent payment testing. Razorpay captured-order ingestion is handled by the server webhook.
