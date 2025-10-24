import "dotenv/config";

export const port = Number(process.env.PORT || 5000);

function fb(name, val, def) {
  if (!val) {
    console.warn(`[ENV] ${name} missing -> using default: ${def}`);
    return def;
  }
  return val;
}

export const momo = {
  partnerCode: "MOMO",
  accessKey: "F8BBA842ECF85",
  secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  redirectUrl: "http://localhost:5000/payments/return",
  ipnUrl: "https://example.ngrok.io/payments/ipn",
  requestType: "payWithMethod",
  lang: "vi",
  partnerName: "Online Academy",
  storeId: "AcademyStore",
  endpointCreate: "https://test-payment.momo.vn/v2/gateway/api/create",
  endpointQuery: "https://test-payment.momo.vn/v2/gateway/api/query",
};
