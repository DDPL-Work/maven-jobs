import api from "./api";

const paymentService = {
  createOrder: async (planType, customAmount) => {
    const res = await api.post("/payment/create-order", { planType, customAmount });
    return res.data;
  },

  confirmPayment: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const res = await api.post("/payment/confirm", {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return res.data;
  },

  verifyPayment: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const res = await api.post("/payment/verify", {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return res.data;
  },

  getPlans: async (role) => {
    const res = await api.get("/payment/plans", { params: { role } });
    return res.data;
  },
};

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

async function openRazorpayCheckout({ order, keyId, user, onSuccess, onError }) {
  try {
    const Razorpay = await loadRazorpayScript();

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "MavenJobs",
      description: order.planLabel || "Premium Membership",
      order_id: order.orderId,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      theme: { color: "#002366" },
      handler: async (response) => {
        try {
          const result = await paymentService.confirmPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          onSuccess?.(result);
        } catch (err) {
          onError?.(err?.response?.data?.message || err.message || "Payment confirmation failed");
        }
      },
      modal: {
        ondismiss: () => {
          onError?.("Payment cancelled");
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    onError?.(err.message || "Failed to initialize payment");
  }
}

paymentService.openCheckout = openRazorpayCheckout;

export default paymentService;
