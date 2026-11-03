import { useState } from "react";
import Elysium from "elysium-attribution";

const formatINR = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(value);

async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || "Payment request failed");
  return data;
}

function Checkout() {
  const [amount, setAmount] = useState("499");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePayment = async (event) => {
    event.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      if (!window.Razorpay) throw new Error("Razorpay Checkout did not load. Check your internet connection and reload the page.");

      let attributionToken;
      try {
        if (email) await Elysium.identify(email);
        attributionToken = await Elysium.getCheckoutToken();
      } catch (error) {
        console.warn("Attribution token unavailable; continuing payment test:", error);
      }

      const orderData = await readJson(await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), email, attributionToken }),
      }));

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Northstar Store",
        description: "Razorpay integration test",
        order_id: orderData.order.id,
        prefill: email ? { email } : {},
        notes: attributionToken ? { attribution_token: attributionToken } : {},
        theme: { color: "#126b55" },
        handler: async (payment) => {
          try {
            const verification = await readJson(await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payment),
            }));
            setResult({ type: "success", title: "Test payment verified", detail: `Payment ${verification.paymentId} was confirmed for ${formatINR(Number(amount))}.` });
          } catch (error) {
            setResult({ type: "error", title: "Could not verify payment", detail: error.message });
          }
        },
        modal: { ondismiss: () => setResult({ type: "info", title: "Checkout closed", detail: "No payment confirmation was received. You can safely try again." }) },
      };

      const rzpGateway = Elysium.gateways.registry.get("razorpay");
      if (!rzpGateway) throw new Error("Elysium Razorpay gateway is unavailable. Check the SDK configuration.");
      const wrappedOptions = rzpGateway.wrapOptions(options, attributionToken);
      const checkout = rzpGateway.wrapInstance(new window.Razorpay(wrappedOptions));
      checkout.on("payment.failed", (event) => {
        setResult({ type: "error", title: "Test payment failed", detail: event.error?.description || "Razorpay did not complete this payment. Try again with another test outcome." });
      });
      checkout.open();
    } catch (error) {
      setResult({ type: "error", title: "Checkout could not start", detail: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="checkout-section">
      <div className="section-heading"><div><p className="eyebrow">YOUR TEST CHECKOUT</p><h2>Make a test payment</h2></div><span className="lock-label">▣ &nbsp; Secure by Razorpay</span></div>
      <div className="checkout-grid">
        <form className="payment-card" onSubmit={handlePayment}>
          <label htmlFor="email">Email address <span>Optional</span></label>
          <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          <label htmlFor="amount">Test amount <span>INR</span></label>
          <div className="amount-input"><span>₹</span><input id="amount" type="number" min="1" max="100000" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required /></div>
          <button className="pay-button" type="submit" disabled={loading || !amount || Number(amount) <= 0}>
            {loading ? "Preparing secure checkout…" : <>Continue to Razorpay <span>→</span></>}
          </button>
          <p className="safe-note"><span>✓</span> You are in test mode. No real money will be charged.</p>
          {result && <div className={`result-banner ${result.type}`} role="status"><b>{result.title}</b><p>{result.detail}</p></div>}
        </form>
        <aside className="order-card">
          <div className="order-head"><span>ORDER SUMMARY</span><span className="test-pill">TEST ORDER</span></div>
          <div className="product-row"><div className="product-icon">✦</div><div><b>Integration test</b><small>Razorpay checkout flow</small></div><span>{formatINR(Number(amount) || 0)}</span></div>
          <div className="summary-line"><span>Subtotal</span><b>{formatINR(Number(amount) || 0)}</b></div>
          <div className="summary-line"><span>Tax</span><span>Included</span></div>
          <div className="summary-total"><span>Total due</span><b>{formatINR(Number(amount) || 0)}</b></div>
          <div className="flow-list"><p>WHAT THIS CHECKS</p><span><i>1</i> Server creates a Razorpay test order</span><span><i>2</i> Checkout opens with your test key</span><span><i>3</i> Server verifies the payment signature</span></div>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;
