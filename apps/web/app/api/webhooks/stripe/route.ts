import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getPlanByStripePriceId } from '@tribemem/shared';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function getSupabaseServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = getSupabaseServiceClient();
  const orgId = session.metadata?.org_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!orgId) {
    console.error('checkout.session.completed: missing org_id in metadata');
    return;
  }

  // Retrieve the subscription to get the price ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanByStripePriceId(priceId) : null;
  const planId = plan?.id ?? 'starter';

  // Update the organization with Stripe IDs and plan
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      plan: planId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      usage_this_period: { crawl_events: 0, extractions: 0, queries: 0, api_calls: 0, tokens_used: 0 },
      usage_reset_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', orgId);

  if (updateError) {
    console.error('checkout.session.completed: failed to update org', updateError);
    return;
  }

  // Record billing event
  await supabase.from('billing_events').insert({
    org_id: orgId,
    event_type: 'subscription_created',
    stripe_event_id: session.id,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    description: `Subscribed to ${planId} plan`,
    metadata: { price_id: priceId, subscription_id: subscriptionId },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServiceClient();
  const customerId = subscription.customer as string;

  // Look up org by stripe_customer_id
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (orgError || !org) {
    console.error('subscription.updated: org not found for customer', customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanByStripePriceId(priceId) : null;

  const updateData: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    usage_reset_at: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  // Only update plan if we can resolve the price ID
  if (plan) {
    updateData.plan = plan.id;
  }

  const { error: updateError } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', org.id);

  if (updateError) {
    console.error('subscription.updated: failed to update org', updateError);
    return;
  }

  await supabase.from('billing_events').insert({
    org_id: org.id,
    event_type: 'subscription_updated',
    stripe_event_id: subscription.id,
    amount_cents: 0,
    currency: 'usd',
    description: `Subscription updated to ${plan?.id ?? 'unknown'} plan`,
    metadata: { price_id: priceId, status: subscription.status },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServiceClient();
  const customerId = subscription.customer as string;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (orgError || !org) {
    console.error('subscription.deleted: org not found for customer', customerId);
    return;
  }

  // Downgrade to free plan
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
      usage_this_period: { crawl_events: 0, extractions: 0, queries: 0, api_calls: 0, tokens_used: 0 },
      usage_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', org.id);

  if (updateError) {
    console.error('subscription.deleted: failed to downgrade org', updateError);
    return;
  }

  await supabase.from('billing_events').insert({
    org_id: org.id,
    event_type: 'subscription_cancelled',
    stripe_event_id: subscription.id,
    amount_cents: 0,
    currency: 'usd',
    description: 'Subscription cancelled, downgraded to free plan',
    metadata: { previous_status: subscription.status },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = getSupabaseServiceClient();
  const customerId = invoice.customer as string;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!org) {
    console.error('invoice.payment_succeeded: org not found for customer', customerId);
    return;
  }

  await supabase.from('billing_events').insert({
    org_id: org.id,
    event_type: 'payment_succeeded',
    stripe_event_id: invoice.id,
    amount_cents: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? 'usd',
    description: `Payment succeeded for invoice ${invoice.number ?? invoice.id}`,
    metadata: { invoice_url: invoice.hosted_invoice_url },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = getSupabaseServiceClient();
  const customerId = invoice.customer as string;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!org) {
    console.error('invoice.payment_failed: org not found for customer', customerId);
    return;
  }

  // Record the failed payment
  await supabase.from('billing_events').insert({
    org_id: org.id,
    event_type: 'payment_failed',
    stripe_event_id: invoice.id,
    amount_cents: invoice.amount_due ?? 0,
    currency: invoice.currency ?? 'usd',
    description: `Payment failed for invoice ${invoice.number ?? invoice.id}`,
    metadata: {
      invoice_url: invoice.hosted_invoice_url,
      attempt_count: invoice.attempt_count,
      next_payment_attempt: invoice.next_payment_attempt,
    },
  });

  // Create an alert for the org (using 'usage_limit' type as closest available)
  await supabase.from('alerts').insert({
    org_id: org.id,
    type: 'usage_limit',
    severity: 'critical',
    title: 'Payment failed',
    description: `Your payment of $${((invoice.amount_due ?? 0) / 100).toFixed(2)} failed. Please update your payment method to avoid service interruption. Grace period ends ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}.`,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
