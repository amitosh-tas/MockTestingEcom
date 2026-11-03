import { useEffect } from "react";
import Checkout from "./Checkout";
// import StripeCheckout from "./StripeCheckout"; // Stripe is paused for now.
import AttributionTools from "./AttributionTools";
import Elysium from "elysium-attribution";
import elysiumConfig from "../elysium.config.js";

function App() {
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
        {/* Stripe selector and <StripeCheckout /> are paused; Razorpay only for now. */}
        <Checkout />
      </div>

      <AttributionTools />

      <footer className="footer"><span>Built for integration testing</span><span>Razorpay test mode</span></footer>
    </main>
  );
}

export default App;
