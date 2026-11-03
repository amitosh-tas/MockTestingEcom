
function CHECKOUTBUTTON({
  price,
  loading,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="elysium-payment-button"
    >
      {loading ? "Processing..." : `Pay ₹${price}`}
    </button>
  );
}

export default CHECKOUTBUTTON;
