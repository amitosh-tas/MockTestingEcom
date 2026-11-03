import { useState } from "react";
import Elysium from "elysium-attribution";

function AttributionTools() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [visitorId, setVisitorId] = useState(() => Elysium.getVisitorId());
  const [newVisitorId, setNewVisitorId] = useState("");
  const [amount, setAmount] = useState("499");
  const [orderId, setOrderId] = useState(() => `manual_${Date.now()}`);
  const [bookingId, setBookingId] = useState(() => `booking_${Date.now()}`);
  const [appointmentAt, setAppointmentAt] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [serviceName, setServiceName] = useState("Integration test booking");
  const [debug, setDebug] = useState(() => Boolean(Elysium.getConfig()?.debug));
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState(null);

  const run = async (label, action) => {
    setBusy(true);
    try {
      const data = await action();
      setOutput({ label, ok: true, data });
    } catch (error) {
      setOutput({ label, ok: false, data: error?.message || String(error) });
    } finally {
      setBusy(false);
      setVisitorId(Elysium.getVisitorId());
    }
  };

  return (
    <details className="attribution-tools">
      <summary><span><b>Attribution tools</b><small>Exercise the Elysium SDK core API</small></span><span className="tools-chevron">⌄</span></summary>
      <div className="tools-content">
        <div className="tools-status"><span>Visitor ID</span><code>{visitorId || "Not available"}</code><button type="button" disabled={busy} onClick={() => setVisitorId(Elysium.getVisitorId())}>Refresh</button></div>
        <div className="tools-grid">
          <section className="tool-card"><h3>Touch tracking</h3><p>Record the current page, campaign parameters, referrer, and optional test data.</p><button disabled={busy} onClick={() => run("recordTouch", () => Elysium.recordTouch({ force: true, customData: { source: "attribution_tools" } }))}>Record touch</button></section>
          <section className="tool-card"><h3>Identify visitor</h3><p>Associate this visitor with a customer profile.</p><input aria-label="Customer email" type="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} /><input aria-label="Customer phone" placeholder="Phone (optional)" value={phone} onChange={(event) => setPhone(event.target.value)} /><button disabled={busy || !email} onClick={() => run("identify", () => Elysium.identify(email, phone || undefined))}>Identify</button></section>
          <section className="tool-card"><h3>Checkout session</h3><p>Freeze touchpoints and obtain an attribution token for a payment.</p><div className="tool-actions"><button disabled={busy} onClick={() => run("getCheckoutToken", () => Elysium.getCheckoutToken())}>Get token</button><button disabled={busy} onClick={() => run("createCheckoutSession", () => Elysium.createCheckoutSession({ expiresInMs: 7200000 }))}>Create session</button></div></section>
          <section className="tool-card"><h3>Visitor ID</h3><p>Set a canonical identifier for cross-session testing.</p><input aria-label="New visitor ID" placeholder="Canonical visitor ID" value={newVisitorId} onChange={(event) => setNewVisitorId(event.target.value)} /><button disabled={busy || !newVisitorId.trim()} onClick={() => run("setVisitorId", () => { Elysium.setVisitorId(newVisitorId.trim()); return Elysium.getVisitorId(); })}>Set visitor ID</button></section>
          <section className="tool-card"><h3>Create test order</h3><p>Send a conversion to Elysium directly. A payment webhook is preferred for real paid orders.</p><input aria-label="Order ID" value={orderId} onChange={(event) => setOrderId(event.target.value)} /><input aria-label="Order amount in rupees" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} /><button disabled={busy || !orderId || Number(amount) <= 0} onClick={() => run("createOrder", () => Elysium.createOrder({ externalId: orderId, orderedAt: new Date().toISOString(), currency: "INR", grossAmount: Number(amount), netAmount: Number(amount), email: email || undefined, items: [{ name: "Manual SDK test order", quantity: 1, unitAmount: Number(amount), currency: "INR", externalId: "manual-test-item" }] }))}>Send test order</button></section>
          <section className="tool-card"><h3>Create test booking</h3><p>Record an appointment or reservation attributed at booking time.</p><input aria-label="Booking ID" value={bookingId} onChange={(event) => setBookingId(event.target.value)} /><input aria-label="Appointment date and time" type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} /><input aria-label="Service name" value={serviceName} onChange={(event) => setServiceName(event.target.value)} /><button disabled={busy || !bookingId || !appointmentAt} onClick={() => run("createBooking", () => Elysium.createBooking({ externalId: bookingId, appointmentStartAt: new Date(appointmentAt).toISOString(), currency: "INR", bookedValue: Number(amount), serviceName, email: email || undefined, phone: phone || undefined }))}>Send test booking</button></section>
          <section className="tool-card"><h3>Runtime configuration</h3><p>Update SDK debug logging without exposing any secret keys.</p><label className="debug-toggle"><input type="checkbox" checked={debug} onChange={(event) => setDebug(event.target.checked)} /> Enable debug logs</label><button disabled={busy} onClick={() => run("configure", () => Elysium.configure({ debug }))}>Apply configuration</button></section>
        </div>
        {output && <div className={`tool-output ${output.ok ? "" : "failed"}`}><div><b>{output.label}</b><span>{output.ok ? "Response" : "Error"}</span></div><pre>{JSON.stringify(output.data, null, 2)}</pre></div>}
      </div>
    </details>
  );
}

export default AttributionTools;
