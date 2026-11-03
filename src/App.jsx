import { useEffect, useState } from "react";
import Checkout from "./Checkout";
import StripeCheckout from "./StripeCheckout";
import AttributionTools from "./AttributionTools";
import Elysium from "elysium-attribution";
import elysiumConfig from "../elysium.config.js";

function App() {
  const [provider, setProvider] = useState(() => new URLSearchParams(window.location.search).has("stripe_session_id") || new URLSearchParams(window.location.search).has("stripe_cancelled") ? "stripe" : "razorpay");
  useEffect(() => {
    try {
      Elysium.init(elysiumConfig);
    } catch (error) {
      console.warn("Attribution SDK could not initialize:", error);
    }
  }, []);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Northstar home">
          <span className="brand-mark">N</span> northstar<span className="brand-dot">.</span>
        </a>
        <span className="environment"><span /> Test payment environment</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PAYMENT PLAYGROUND · INDIA</p>
          <h1>See your checkout<br />come to life.</h1>
          <p className="hero-description">A safe test checkout to verify your payment integration, from order creation to payment confirmation.</p>
          <div className="trust-row"><span>✓</span> Test mode only <i /> No real charges</div>
        </div>
        <div className="orb orb-one" /><div className="orb orb-two" />
        <div className="hero-stamp"><span>TEST</span><b>PAYMENTS</b><small>MADE SIMPLE</small></div>
      </section>

      <div className="payment-area">
        <div className="provider-switch" role="tablist" aria-label="Payment provider">
          <button type="button" role="tab" aria-selected={provider === "razorpay"} className={provider === "razorpay" ? "active" : ""} onClick={() => setProvider("razorpay")}>Razorpay</button>
          <button type="button" role="tab" aria-selected={provider === "stripe"} className={provider === "stripe" ? "active" : ""} onClick={() => setProvider("stripe")}>Stripe</button>
        </div>
        {provider === "razorpay" ? <Checkout /> : <StripeCheckout />}
      </div>

      <AttributionTools />

      <footer className="footer"><span>Built for integration testing</span><span>Razorpay &amp; Stripe test modes</span></footer>
    </main>
  );
}

export default App;
