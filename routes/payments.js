import express from 'express';
import db from '../db.js';
import { createPayment, verifyIpnSignature } from '../services/momo.js';

const router = express.Router();

function buildOrderInfo(order, items) {
  const names = items.map(i => i.title).filter(Boolean);
  if (!names.length) return `Thanh toán đơn hàng #${order.orderid}`;
  const head = names.slice(0,2).join(', ');
  const more = names.length > 2 ? ` +${names.length-2} courses` : '';
  return `Thanh toán ${head}${more} (Order #${order.orderid})`;
}

function sumFromItems(items = []) {
  return items.reduce((acc, it) => {
    const price = Number(it.unit_price || 0);
    const qty = Number(it.quantity || 1);
    const disc = Number(it.discount_vnd || 0);
    const tax = Number(it.tax_vnd || 0);
    return acc + (price * qty - disc + tax);
  }, 0);
}

router.get('/go', async (req, res) => {
  try {
    const orderId = parseInt(req.query.orderId || '0', 10);
    const expire = parseInt(req.query.expire || '0', 10);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).send('orderId invalid');
    }

    const order = await db('orders').where({ orderid: orderId }).first();
    if (!order) return res.status(404).send('Order not found');

    const items = await db('order_items as oi')
      .leftJoin('courses as c', 'oi.courseid', 'c.courseid')
      .select('oi.*', 'c.title')
      .where('oi.orderid', orderId);

    let amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      amount = sumFromItems(items);
    }
    amount = Math.round(amount);

    const orderInfo = buildOrderInfo(order, items);

    const momoRes = await createPayment({ amount, orderInfo, expireMs: expire });

    await db('payments').insert({
      orderid: order.orderid,
      amount: amount,
      payment_method: 'momo',
      payment_status: 'pending',
      requestid: momoRes.requestId,
      signature: momoRes.signature || null,
      transid: null
    });

    return res.redirect(momoRes.payUrl);
  } catch (e) {
    console.error(e);
    return res.status(500).send(e.message);
  }
});

router.post('/ipn', express.json(), async (req, res) => {
  try {
    const ipn = req.body;
    const ok = verifyIpnSignature(ipn);
    if (!ok) return res.status(403).json({ message: 'Invalid signature' });

    // Update payments by requestid
    const status =
      Number(ipn.resultCode) === 0 ? 'completed' :
      Number(ipn.resultCode) === 9000 ? 'pending' : 'failed';

    const upd = await db('payments')
      .where({ requestid: ipn.requestId })
      .update({
        transid: ipn.transId,
        signature: ipn.signature,
        payment_status: status,
        amount: Number(ipn.amount)
      });

    if (upd > 0) {
      // Find orderid for status sync
      const pay = await db('payments').where({ requestid: ipn.requestId }).first();
      const orderStatus = (status === 'completed') ? 'paid' :
                          (status === 'failed') ? 'failed' : 'pending';
      await db('orders').where({ orderid: pay.orderid }).update({ status: orderStatus });
    }

    return res.status(204).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
  }
});

router.get('/return', async (req, res) => {
  const requestId = req.query.requestId || null;
  let payment = null;
  if (requestId) {
    payment = await db('payments').where({ requestid: requestId }).first();
  }
  res.render('payments/result', { payment });
});

export default router;
