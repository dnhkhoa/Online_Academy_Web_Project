import express from 'express';
import db from '../utils/db.js';
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
    const tax = Number(5000);
    return acc + (price * qty - disc + tax);
  }, 0);
}
import * as courseModel from '../models/course.model.js';
router.get('/go', async (req, res) => {
    try {
      const userId = req.session?.userid || 1; // hoặc lấy từ token/session thật
      const courseIds = req.query.courseIds;
      
      if (!courseIds) {
        return res.status(400).send('No courses selected.');
      }
      
      // Nếu chỉ chọn 1 khóa thì đảm bảo nó là mảng
      const selectedCourses = Array.isArray(courseIds) ? courseIds : [courseIds];
      const alreadyEnrolled = [];
      const notEnrolled = [];
      for (const cid of selectedCourses) {
        const enrolled = await courseModel.isEnrolledItem(userId, cid);
        if (enrolled) {
          alreadyEnrolled.push(cid);
        } else {
          notEnrolled.push(cid);
        }
      }

      if (notEnrolled.length === 0) {
        
        return res.render('vwCart/error', {
          cartItems: await courseModel.cartItemsByUID(userId),
          alreadyEnrolled: true,
          
        });

      }
      // Lấy danh sách orderid tương ứng từng course
      const orderList = await Promise.all(
        selectedCourses.map(async (cid) => {
          const row = await courseModel.getCartIDByCourseIDAndUserID(cid, userId);
          return row ? row.orderid : null;
        })
      );
  
      // Lọc bỏ những course không có orderid
      const validOrderIds = orderList.filter(Boolean);
      if (validOrderIds.length === 0) {
        return res.status(400).send('No valid order IDs found.');
      }
  
      // Giả sử: mỗi user có 1 order gộp, hoặc bạn chỉ xử lý theo order đầu tiên
      const orderId = validOrderIds[0];
  
      // Lấy thông tin order
      const order = await db('orders').where({ orderid: orderId }).first();
      if (!order) {
        return res.status(404).send('Order not found.');
      }
  
      // Lấy items của order để tính tổng tiền
      const items = await courseModel.cartItemsByUID(order.userid);
  
      let amount = Number(order.total);
      if (!Number.isFinite(amount) || amount <= 0) {
        amount = sumFromItems(items);
      }
      amount = Math.round(amount);
  
      const orderInfo = buildOrderInfo(order, items);
  
      // Gọi API MoMo
      const momoRes = await createPayment({ amount, orderInfo });
  
      // Ghi vào bảng payments
      await db('payments').insert({
        orderid: order.orderid,
        amount: amount,
        payment_method: 'momo',
        payment_status: 'pending',
        requestid: momoRes.requestId,
        signature: momoRes.signature || null,
        transid: null
      });
  
      // Chuyển hướng người dùng đến trang thanh toán MoMo
      return res.redirect(momoRes.payUrl);
  
    } catch (e) {
      console.error(e);
      return res.status(500).send(e.message);
    }
  });
  
  
router.post('/ipn', express.json(), async (req, res) => {
    try {
      const ipn = req.body;
      console.log('📩 [MoMo IPN] Received:', ipn);

      const valid = verifyIpnSignature(ipn);
      if (!valid) {
        console.error('❌ [MoMo IPN] Invalid signature:', ipn);
        return res.status(403).json({ message: 'Invalid signature' });
      }
  
      // 2️⃣ Xác định trạng thái giao dịch từ resultCode
      let status = 'failed';
      if (Number(ipn.resultCode) === 0) status = 'completed';
      else if (Number(ipn.resultCode) === 9000) status = 'pending';
  
      // 3️⃣ Cập nhật thông tin vào bảng payments
      const updated = await db('payments')
        .where({ requestid: ipn.requestId })
        .update({
          transid: ipn.transId || null,
          signature: ipn.signature,
          amount: Number(ipn.amount) || 0,
          payment_status: status,
          paidat: new Date(),
          createdat : new Date()
        });
  
      if (updated === 0) {
        console.warn('⚠️ [MoMo IPN] Payment not found for requestId:', ipn.requestId);
        return res.status(404).json({ message: 'Payment record not found' });
      }
  
      // 4️⃣ Lấy thông tin thanh toán + đơn hàng
      const payment = await db('payments').where({ requestid: ipn.requestId }).first();
      const order = await db('orders').where({ orderid: payment.orderid }).first();
  
      if (!order) {
        console.warn('⚠️ [MoMo IPN] Order not found for orderid:', payment.orderid);
        return res.status(404).json({ message: 'Order not found' });
      }
  
      // 5️⃣ Cập nhật trạng thái đơn hàng
      const orderStatus =
        status === 'completed' ? 'paid' :
        status === 'failed' ? 'failed' : 'pending';
  
      await db('orders')
        .where({ orderid: order.orderid })
        .update({
          status: orderStatus,
          updatedat: new Date()
        });
  
      console.log(`🧾 [Order ${order.orderid}] updated -> ${orderStatus}`);
  
      // 6️⃣ Nếu thanh toán thành công -> thêm bản ghi vào bảng enrollment
      if (status === 'completed') {
        const order = await db('orders').where({ orderid: payment.orderid }).first();
      
        if (order && order.courseid && order.userid) {

          const exists = await db('enrollments')
            .where({ userid: order.userid, courseid: order.courseid })
            .first();
      
          if (!exists) {
            await db('enrollments').insert({
              userid: order.userid,
              courseid: order.courseid,
              enrolledat: new Date(),
            });
            console.log(`✅ Enrolled user ${order.userid} to course ${order.courseid}`);
          } else {
            console.log(`ℹ️ Enrollment already exists for user ${order.userid}, course ${order.courseid}`);
          }
        } else {
          console.warn(`⚠️ Order ${pay.orderid} missing userid or courseid`);
        }
      }
  
      // 7️⃣ Trả về phản hồi cho MoMo (MoMo chỉ cần HTTP 204 hoặc 200)
      console.log(`✅ [MoMo IPN] Processed successfully: order ${order.orderid}, status: ${status}`);
      return res.status(204).end();
  
    } catch (error) {
      console.error('🔥 [MoMo IPN] Error:', error);
      return res.status(500).json({ message: error.message });
    }
  });
  
  
  

  router.get('/return', async (req, res) => {
    try {
      // Lấy toàn bộ query string MoMo trả về
      const momoRes = req.query;
      console.log('🎯 MoMo return:', momoRes);
  
      // ✅ Bước 1: Kiểm tra chữ ký trả về (để tránh fake request)
      const validSig = verifyIpnSignature(momoRes);
      if (!validSig) {
        return res.render('vwPayment/result', {
          payment: null,
          message: 'Invalid signature from MoMo!',
          success: false
        });
      }
  
      // ✅ Bước 2: Lấy payment trong DB
      const payment = await db('payments')
        .where({ requestid: momoRes.requestId })
        .first();
  
      if (!payment) {
        return res.render('vwPayment/result', {
          payment: null,
          message: 'Payment not found!',
          success: false
        });
      }
  
      // ✅ Bước 3: Kiểm tra trạng thái giao dịch
      let success = false;
      if (Number(momoRes.resultCode) === 0) {
        success = true;
      }
  
      // ✅ Bước 4: Render kết quả cho người dùng
      res.render('vwPayment/result', {
        payment,
        message: success
          ? 'Thanh toán thành công! Cảm ơn bạn.'
          : 'Thanh toán thất bại hoặc đã bị hủy.',
        success
      });
  
    } catch (err) {
      console.error('🔥 Error in /return:', err);
      res.render('vwPayment/result', {
        payment: null,
        message: 'Có lỗi xảy ra trong quá trình xử lý thanh toán.',
        success: false
      });
    }
  });


export default router;
