import express from "express";
import crypto from "crypto";

const router = express.Router();

// Payment review page
router.get("/", (req, res) => {
  const amount = Number(req.query.amount || 0);
  const items = String(req.query.items || "");
  const method = String(req.query.method || "momo");

  res.render("vwPayments/payments", {
    amount,
    items,
    method,
  });
});

// Create MoMo payment and redirect
router.get("/momo", async (req, res) => {
  try {
    const amount = String(req.query.amount || "0");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).send("Invalid amount for MoMo payment");
    }

    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    if (!partnerCode || !accessKey || !secretKey) {
      return res
        .status(500)
        .send(
          "MoMo credentials are not configured. Set MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY."
        );
    }

    const requestId = `${partnerCode}-${Date.now()}`;
    const orderId = `OA_${Date.now()}`;
    const orderInfo = `Online Academy order ${orderId}`;
    const host = `${req.protocol}://${req.get("host")}`;
    const redirectUrl = `${host}/payment/return`;
    const ipnUrl = `${host}/payment/ipn`;
    const requestType = "captureWallet";
    const extraData = Buffer.from(
      JSON.stringify({ source: "cart", items: req.query.items || "" })
    ).toString("base64");

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const body = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType,
      extraData,
      signature,
      lang: "vi",
    };

    const resp = await fetch(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await resp.json();

    if (data?.payUrl) {
      return res.redirect(data.payUrl);
    }
    return res
      .status(502)
      .send(
        `Failed to create MoMo payment: ${data?.message || "Unknown error"}`
      );
  } catch (err) {
    console.error("MoMo create error", err);
    return res.status(500).send("MoMo payment error");
  }
});

// MoMo redirect URL (user's browser returns here)
router.get("/return", (req, res) => {
  const {
    resultCode = "",
    message = "",
    orderId = "",
    amount = "",
    transId = "",
  } = req.query;

  const success = String(resultCode) === "0";
  res.render("vwPayments/payments", {
    amount: Number(amount || 0),
    orderId,
    transId,
    momoMessage: message,
    momoSuccess: success,
    returned: true,
  });
});

// MoMo IPN (server-to-server notification)
router.post("/ipn", express.json(), (req, res) => {
  try {
    console.log("MoMo IPN:", req.body);
  } catch {}
  // Always acknowledge receipt (MoMo expects 2xx)
  res.json({ resultCode: 0, message: "OK" });
});

export default router;
