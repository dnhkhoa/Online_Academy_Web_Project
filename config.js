import 'dotenv/config';

export const port = Number(process.env.PORT || 5000);

function fb(name, val, def) {
  if (!val) {
    console.warn(`[ENV] ${name} missing -> using default: ${def}`);
    return def;
  }
  return val;
}

export const momo = {
  partnerCode: fb('MOMO_PARTNER_CODE', process.env.MOMO_PARTNER_CODE, 'MOMO'),
  accessKey:   fb('MOMO_ACCESS_KEY',   process.env.MOMO_ACCESS_KEY,   'F8BBA842ECF85'),
  secretKey:   fb('MOMO_SECRET_KEY',   process.env.MOMO_SECRET_KEY,   'K951B6PE1waDMi640xX08PD3vg6EkVlz'),
  redirectUrl: fb('MOMO_REDIRECT_URL', process.env.MOMO_REDIRECT_URL, 'http://localhost:5000/payment/return'),
  ipnUrl:      fb('MOMO_IPN_URL',      process.env.MOMO_IPN_URL,      'https://example.ngrok.io/payment/ipn'),
  requestType: process.env.MOMO_REQUEST_TYPE || 'payWithMethod',
  lang:        process.env.MOMO_LANG || 'vi',
  partnerName: process.env.MOMO_PARTNER_NAME || 'Online Academy',
  storeId:     process.env.MOMO_STORE_ID || 'AcademyStore',
  endpointCreate: 'https://test-payment.momo.vn/v2/gateway/api/create',
  endpointQuery:  'https://test-payment.momo.vn/v2/gateway/api/query',
};
