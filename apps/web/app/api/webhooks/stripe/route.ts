import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  try {
    // In production, verify the webhook signature using Stripe SDK:
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

    const event = JSON.parse(body);

    switch (event.type) {
      case 'checkout.session.completed': {
        // Handle successful checkout
        // Update organization plan in database
        console.log('Checkout completed:', event.data.object.id);
        break;
      }
      case 'customer.subscription.updated': {
        // Handle subscription update
        console.log('Subscription updated:', event.data.object.id);
        break;
      }
      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        // Downgrade organization to free plan
        console.log('Subscription deleted:', event.data.object.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object.id);
        break;
      }
      case 'invoice.payment_failed': {
        // Handle failed payment
        // Send notification to organization admins
        console.log('Payment failed:', event.data.object.id);
        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
