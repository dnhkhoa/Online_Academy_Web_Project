import crypto from 'crypto';
import axios from 'axios';
import { momo } from '../config.js';

function signRaw(raw) {
  return crypto.createHmac('sha256', momo.secretKey).update(raw).digest('hex');
}

export function buildCreateBody({ amount, orderInfo, expireMs = 0 }) {
  const orderId = momo.partnerCode + Date.now();
  const requestId = orderId;
  const extraData = '';

  const rawSignature =
    `accessKey=${momo.accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${momo.ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${momo.partnerCode}` +
    `&redirectUrl=${momo.redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${momo.requestType}`;

  const signature = signRaw(rawSignature);

  const payload = {
    partnerCode: momo.partnerCode,
    partnerName: momo.partnerName,
    storeId: momo.storeId,
    requestId,
    amount: String(amount),
    orderId,
    orderInfo,
    redirectUrl: momo.redirectUrl,
    ipnUrl: momo.ipnUrl,
    lang: momo.lang,
    requestType: momo.requestType,
    autoCapture: true,
    extraData,
    orderGroupId: '',
    signature,
  };

  if (expireMs && Number.isInteger(expireMs) && expireMs > 0) {
    payload.orderExpireTime = Date.now() + expireMs;
  }

  return { payload, orderId, requestId };
}

export async function createPayment({ amount, orderInfo, expireMs = 0 }) {
  const { payload } = buildCreateBody({ amount, orderInfo, expireMs });
  const res = await axios.post(momo.endpointCreate, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
}

export function verifyIpnSignature(ipn) {
  const raw =
    `accessKey=${momo.accessKey}` +
    `&amount=${ipn.amount}` +
    `&extraData=${ipn.extraData}` +
    `&message=${ipn.message}` +
    `&orderId=${ipn.orderId}` +
    `&orderInfo=${ipn.orderInfo}` +
    `&orderType=${ipn.orderType}` +
    `&partnerCode=${ipn.partnerCode}` +
    `&payType=${ipn.payType}` +
    `&requestId=${ipn.requestId}` +
    `&responseTime=${ipn.responseTime}` +
    `&resultCode=${ipn.resultCode}` +
    `&transId=${ipn.transId}`;
  const expected = signRaw(raw);
  return expected === ipn.signature;
}
