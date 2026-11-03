/**
 * ElysiumSDK Configuration File
 *
 * IMPORTANT SECURITY NOTICE:
 * This configuration is loaded on the client side (browser).
 * ONLY include PUBLISHABLE keys here. NEVER expose secret keys
 * (e.g., Stripe secret key "sk_live_...", Razorpay key secret, or private tokens).
 * Secret keys must remain strictly on your backend server.
 */
export default {
  // Public publishable API Key provided by Elysium (pk_live_... or pk_test_...)
  apiKey: "pk_test_TJ1NS0GTPCkE1Py8SuJWIinGiJBxU8TzAOkx5y6Gnas",

  // Attribution Backend API endpoint (e.g. http://localhost:5000 or https://api.yourdomain.com)
  apiBaseUrl: "https://asb-sonu.vercel.app",

  // Enable verbose debugging logs in browser console
  debug: false,

  // Session inactivity timeout in milliseconds (default: 30 minutes)
  sessionWindowMs: 30 * 60 * 1000,

  // CSS selector or class for detecting checkout/payment buttons
  buttonSelector: ".elysium-payment-button",

  // Automatically record touch on page load
  autoTrack: true,

  // Optional: restrict touch tracking to specific path regex (e.g. product pages only)
  // productPathRegex: null,

  // Domain for cross-subdomain cookie tracking (e.g., ".yourstore.com")
  cookieDomain: undefined,

  // Additional custom query parameters to capture and attribute
  customParams: [],

  // Supported payment gateways configuration (PUBLIC keys only)
  gateways: {
    stripe: {
      enabled: true,
      publishableKey: "pk_test_...", // Stripe Publishable Key (NOT secret key)
    },
    razorpay: {
      enabled: true,
      keyId: "rzp_test_...",        // Razorpay Key ID (NOT key secret)
    },
    paypal: {
      enabled: true,
      clientId: "YOUR_PAYPAL_CLIENT_ID", // PayPal Client ID (NOT client secret)
    },
  },
};
