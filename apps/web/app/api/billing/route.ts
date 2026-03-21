import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

function getSupabaseServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();

    // Get the user's org membership
    const { data: membership, error: memberError } = await serviceClient
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get org subscription details
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, name, plan, stripe_customer_id, stripe_subscription_id')
      .eq('id', membership.org_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // If there's a Stripe subscription, fetch the latest details
    let subscription = null;
    if (org.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
      } catch (stripeError) {
        console.error('Failed to fetch Stripe subscription:', stripeError);
      }
    }

    return NextResponse.json({
      plan: org.plan || 'free',
      stripe_customer_id: org.stripe_customer_id,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            items: subscription.items.data.map((item) => ({
              price_id: item.price.id,
              product_id: typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
              quantity: item.quantity,
            })),
          }
        : null,
    });
  } catch (error) {
    console.error('Billing get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { price_id, success_url, cancel_url } = body;

    if (!price_id) {
      return NextResponse.json({ error: 'price_id is required' }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();

    // Get the user's org
    const { data: membership, error: memberError } = await serviceClient
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (membership.role !== 'admin' && membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only admins can manage billing' }, { status: 403 });
    }

    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, stripe_customer_id')
      .eq('id', membership.org_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = org.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          org_id: org.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      await serviceClient
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=true`,
      metadata: {
        org_id: org.id,
      },
    });

    return NextResponse.json({ checkout_url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Billing checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { price_id } = body;

    if (!price_id) {
      return NextResponse.json({ error: 'price_id is required' }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();

    // Get the user's org
    const { data: membership, error: memberError } = await serviceClient
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (membership.role !== 'admin' && membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only admins can manage billing' }, { status: 403 });
    }

    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, stripe_subscription_id')
      .eq('id', membership.org_id)
      .single();

    if (orgError || !org || !org.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Get current subscription to find the item to update
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
    const subscriptionItem = subscription.items.data[0];

    if (!subscriptionItem) {
      return NextResponse.json({ error: 'Subscription has no items' }, { status: 400 });
    }

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItem.id,
          price: price_id,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    return NextResponse.json({
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: updatedSubscription.current_period_end,
      },
    });
  } catch (error) {
    console.error('Billing update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();

    // Get the user's org
    const { data: membership, error: memberError } = await serviceClient
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (membership.role !== 'admin' && membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only admins can manage billing' }, { status: 403 });
    }

    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, stripe_subscription_id')
      .eq('id', membership.org_id)
      .single();

    if (orgError || !org || !org.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel subscription at end of current billing period
    const cancelledSubscription = await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
        current_period_end: cancelledSubscription.current_period_end,
      },
      message: 'Subscription will be cancelled at end of current billing period',
    });
  } catch (error) {
    console.error('Billing cancel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
