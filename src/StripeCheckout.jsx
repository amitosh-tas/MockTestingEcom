import { useEffect, useRef, useState } from "react";
import Elysium from "elysium-attribution";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

async function responseData(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || "Stripe request failed");
  return data;
}

function StripeCheckout() {
  const [amount, setAmount] = useState("499");
  const [email, setEmail] = useState("");
  const initialUrl = new URL(window.location.href);
  const initialSessionId = initialUrl.searchParams.get("stripe_session_id");
  const canceled = initialUrl.searchParams.has("stripe_cancelled");
  const [loading, setLoading] = useState(Boolean(initialSessionId));
  const [result, setResult] = useState(canceled ? { type: "info", title: "Checkout canceled", detail: "No payment was made. You can safely try again." } : null);
  const conversionRecorded = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("stripe_session_id");
    if (sessionId) {
      fetch(`/api/stripe/session/${encodeURIComponent(sessionId)}`)
        .then(responseData)
        .then((data) => {
          setResult({ type: "success", title: "Test payment verified", detail: `Payment ${data.paymentIntentId || data.sessionId} was confirmed for ${money(data.amount / 100)}.` });
          if (conversionRecorded.current) return;
          conversionRecorded.current = true;
          return Elysium.createOrder({
            externalId: data.paymentIntentId || data.sessionId,
            orderedAt: new Date().toISOString(),
            currency: "INR",
            grossAmount: data.amount / 100,
            netAmount: data.amount / 100,
            email: data.email || undefined,
            items: [{ name: "Northstar test purchase", quantity: 1, unitAmount: data.amount / 100, currency: "INR", externalId: "test-item" }],
          }).catch((error) => console.warn("Attribution conversion could not be recorded:", error));
        })
        .catch((error) => setResult({ type: "error", title: "Could not verify payment", detail: error.message }))
        .finally(() => setLoading(false));
    }
    if (sessionId || canceled) {
      url.searchParams.delete("stripe_session_id");
      url.searchParams.delete("stripe_cancelled");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, [canceled]);

  const handlePayment = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      let attributionToken;
      try {
        if (email) await Elysium.identify(email);
        attributionToken = await Elysium.getCheckoutToken();
      } catch (error) {
        console.warn("Attribution token unavailable; continuing payment test:", error);
      }
      const data = await responseData(await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), email, attributionToken }),
      }));
      window.location.assign(data.url);
    } catch (error) {
      setResult({ type: "error", title: "Checkout could not start", detail: error.message });
      setLoading(false);
    }
  };

  return (
    <section className="checkout-section">
      <div className="section-heading"><div><p className="eyebrow">YOUR TEST CHECKOUT</p><h2>Make a Stripe test payment</h2></div><span className="lock-label">▣ &nbsp; Secure by Stripe</span></div>
      <div className="checkout-grid">
        <form className="payment-card" onSubmit={handlePayment}>
          <label htmlFor="stripe-email">Email address <span>Optional</span></label>
          <input id="stripe-email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          <label htmlFor="stripe-amount">Test amount <span>INR</span></label>
          <div className="amount-input"><span>₹</span><input id="stripe-amount" type="number" min="1" max="100000" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div>
          <button className="pay-button stripe-button" type="submit" disabled={loading || !amount || Number(amount) <= 0}>
            {loading ? "Preparing secure checkout…" : <>Continue to Stripe <span>→</span></>}
          </button>
          <p className="safe-note"><span>✓</span> Stripe test mode only. No real money will be charged.</p>
          {result && <div className={`result-banner ${result.type}`} role="status"><b>{result.title}</b><p>{result.detail}</p></div>}
        </form>
        <aside className="order-card">
          <div className="order-head"><span>ORDER SUMMARY</span><span className="test-pill">TEST ORDER</span></div>
          <div className="product-row"><div className="product-icon">✦</div><div><b>Integration test</b><small>Stripe hosted checkout</small></div><span>{money(Number(amount) || 0)}</span></div>
          <div className="summary-line"><span>Subtotal</span><b>{money(Number(amount) || 0)}</b></div>
          <div className="summary-line"><span>Tax</span><span>Included</span></div>
          <div className="summary-total"><span>Total due</span><b>{money(Number(amount) || 0)}</b></div>
          <div className="flow-list"><p>WHAT THIS CHECKS</p><span><i>1</i> Server creates a Stripe test session</span><span><i>2</i> Stripe hosted Checkout collects payment</span><span><i>3</i> Server confirms the completed session</span></div>
        </aside>
      </div>
    </section>
  );
}

export default StripeCheckout;
