require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

// ------------------------
// Middleware
// ------------------------
app.use(cors());
app.use(helmet());
app.use(express.json());

// ------------------------
// MongoDB
// ------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err.message));

// ------------------------
// Models
// ------------------------
const OrderSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  customer_email: { type: String, required: true },
  address: { type: String, required: true },
  cart: { type: String, required: true },
  total: { type: String, required: true },
  payment_reference: { type: String, required: true, unique: true },
  paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", OrderSchema);

// ------------------------
// Root
// ------------------------
app.get("/", (req, res) => {
  res.json({ message: "🛒 Backend running" });
});

// ------------------------
// PAYSTACK
// ------------------------

// Initialize transaction
app.post("/api/initialize-transaction", async (req, res) => {
  const { email, amount, customer_name, address, cart } = req.body;

  if (!email || !amount)
    return res.status(400).json({ success: false });

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(amount * 100),
        metadata: { customer_name, address, cart }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ success: true, data: response.data.data });
  } catch (err) {
    console.error("❌ Paystack init error:", err.response?.data || err.message);
    res.status(500).json({ success: false });
  }
});

// Verify transaction
app.get("/api/verify-transaction/:reference", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${req.params.reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    res.json({ success: true, data: response.data.data });
  } catch (err) {
    console.error("❌ Verify error:", err.message);
    res.status(500).json({ success: false });
  }
});

// ------------------------
// SAVE ORDER (NO EMAIL BLOCKING)
// ------------------------
app.post("/api/send-order", async (req, res) => {
  const {
    customer_name,
    customer_email,
    address,
    cart,
    total,
    payment_reference
  } = req.body;

  if (!payment_reference || !Array.isArray(cart) || cart.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid order data"
  });
}
  
  try {
    const order = await Order.create({
      customer_name,
      customer_email,
      address,
      cart,
      total,
      payment_reference,
      paid: false
    });

    // Email is OPTIONAL – order already saved
    try {
  await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    public_key: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      customer_name,
      customer_email,
      address,
      total,
      payment_reference,
      cart: JSON.stringify(cart, null, 2)   // 🆕 Include cart as formatted JSON
    }
  });
} catch (emailErr) {
  console.warn("📧 Email failed, order saved", emailErr.message);
}

    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ Order save failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to record order"
    });
  }
});

// ➕ Add this new endpoint here:
app.post("/api/verify-and-save-order", async (req, res) => {
  const {
    payment_reference,
    customer_name,
    customer_email,
    address,
    cart,
    total
  } = req.body;

  // Basic validation
  if (!payment_reference || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order data"
    });
  }

  try {
    const verifyResp = await axios.get(
      `https://api.paystack.co/transaction/verify/${payment_reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paystackData = verifyResp.data.data;

    if (paystackData.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful"
      });
    }

    if (Number(paystackData.amount) !== Math.round(Number(total) * 100)) {
      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch"
      });
    }

    const order = await Order.create({
      customer_name,
      customer_email,
      address,
      cart,
      total,
      payment_reference,
      paid: true
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error("Verification or save failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Server verification error"
    });
  }
});

// ------------------------
// PAYSTACK WEBHOOK (ONLY ONE)
// ------------------------
app.post(
  "/api/paystack-webhook",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }),
  async (req, res) => {
    const signature = req.headers["x-paystack-signature"];

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.warn("❌ Invalid webhook signature");
      return res.sendStatus(401);
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const ref = event.data.reference;

      try {
        const order = await Order.findOne({ payment_reference: ref });
        if (!order) return res.sendStatus(404);

        order.paid = true;
        await order.save();

        console.log("✅ Order paid:", ref);
      } catch (err) {
        console.error("❌ Webhook error:", err.message);
        return res.sendStatus(500);
      }
    }

    res.sendStatus(200);
  }
);

// ------------------------
// Orders
// ------------------------
app.get("/orders", async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// ------------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
