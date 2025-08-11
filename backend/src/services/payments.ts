import axios from 'axios';
import crypto from 'crypto';

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || '';
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID || '';
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || '';
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET || '';

export async function paymobStart(amountEgp: number, orderId: string) {
  // Step 1: auth token
  const authRes = await axios.post('https://accept.paymobsolutions.com/api/auth/tokens', { api_key: PAYMOB_API_KEY });
  const authToken = authRes.data.token as string;
  // Step 2: create order
  const orderRes = await axios.post('https://accept.paymobsolutions.com/api/ecommerce/orders', {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountEgp * 100,
    currency: 'EGP',
    merchant_order_id: orderId,
    items: [],
  });
  const paymobOrderId = orderRes.data.id as number;
  // Step 3: payment key request
  const paymentKeyRes = await axios.post('https://accept.paymobsolutions.com/api/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: amountEgp * 100,
    expiration: 3600,
    order_id: paymobOrderId,
    currency: 'EGP',
    integration_id: Number(PAYMOB_INTEGRATION_ID),
    billing_data: {
      apartment: 'NA', email: 'na@example.com', floor: 'NA', first_name: 'User', street: 'NA', building: 'NA', phone_number: '+200000000000', shipping_method: 'NA', postal_code: 'NA', city: 'Cairo', country: 'EG', last_name: 'User', state: 'NA'
    }
  });
  const paymentToken = paymentKeyRes.data.token as string;
  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
  return { iframeUrl, paymobOrderId };
}

const FAWRY_MERCHANT_CODE = process.env.FAWRY_MERCHANT_CODE || '';
const FAWRY_SECURITY_KEY = process.env.FAWRY_SECURITY_KEY || '';
const FAWRY_RETURN_URL = process.env.FAWRY_RETURN_URL || '';

export function fawryStart(amountEgp: number, orderId: string) {
  const merchantRefNum = orderId;
  const signature = crypto.createHash('sha256').update(`${FAWRY_MERCHANT_CODE}${merchantRefNum}${amountEgp}${FAWRY_SECURITY_KEY}`).digest('hex');
  const payload = {
    merchantCode: FAWRY_MERCHANT_CODE,
    merchantRefNum,
    customerProfileId: 'user-guest',
    paymentMethod: 'PAYATFAWRY',
    orderAmount: amountEgp,
    currencyCode: 'EGP',
    description: 'Booking Payment',
    signature,
    returnUrl: FAWRY_RETURN_URL,
    chargeItems: [],
  };
  // Client can POST this payload to Fawry sandbox endpoint
  return { payload };
}