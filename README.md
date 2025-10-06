# MoMo Integration (DB-mapped, no DB changes)

Uses your existing tables: orders, order_items, courses, payments.

## Run
```
npm i
cp .env.example .env
# set MOMO_IPN_URL to your ngrok URL for IPN tests
npm start
```
Open http://localhost:5000 and enter an existing orderId.

## Flow
- Reads order/order_items/courses to compute amount & orderInfo
- Calls MoMo create
- Inserts a row into payments (method='momo', status='pending', requestid)
- Redirects to payUrl
- IPN -> POST /payments/ipn updates payments + orders (status mapping)
