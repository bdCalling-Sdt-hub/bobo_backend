import Stripe from 'stripe';
import config from '../../config';

const stripe: Stripe = new Stripe(config.stripe?.stripe_api_secret as string, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});
interface IPayload {
  product: {
    amount: number;
    name: string;
    quantity: number;
  };
  // customerId: string;
  paymentId: string;
}
export const createCheckoutSession = async (payload: IPayload) => {
  const paymentGatewayData = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: payload?.product?.name,
            tax_code : "txcd_10203000"
          },
          unit_amount: Math.round(payload.product?.amount * 100),
        },
        quantity: payload.product?.quantity,
      },
    ],

     automatic_tax: { enabled: true },

    success_url: `${config.server_url}/payments/confirm-payment?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payload?.paymentId}`,

    cancel_url: `${config?.client_Url}${config?.cancel_url}`,

    // `${config.server_url}/payments/cancel?paymentId=${payload?.paymentId}`,
    mode: 'payment',
    // metadata: {
    //   user: JSON.stringify({
    //     paymentId: payment.id,
    //   }),
    // },
    invoice_creation: {
      enabled: true,
    },
   
    // customer: payload?.customerId,
    // payment_intent_data: {
    //   metadata: {
    //     payment: JSON.stringify({
    //       ...payment,
    //     }),
    //   },
    // },
    // payment_method_types: ['card', 'amazon_pay', 'cashapp', 'us_bank_account'],
    payment_method_types: ['card'], //, 'paypal'
  });
  return paymentGatewayData;
};
