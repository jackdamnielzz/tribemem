'use client';

import React from 'react';
import { CreditCard, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlanCard } from '@/components/billing/plan-card';
import { UsageBar } from '@/components/billing/usage-bar';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current plan</CardTitle>
              <CardDescription>You are on the Starter plan</CardDescription>
            </div>
            <Badge className="bg-primary">Starter</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">&euro;49</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Usage this period</h4>
            <UsageBar label="Knowledge items" current={1247} limit={5000} />
            <UsageBar label="Connectors" current={3} limit={3} />
            <UsageBar label="Queries" current={654} limit={1000} />
            <UsageBar label="Team members" current={5} limit={10} />
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Upgrade plan
          </Button>
          <Button variant="outline">Manage subscription</Button>
        </CardFooter>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Available plans</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <PlanCard
            name="Growth"
            price={149}
            period="month"
            features={['25,000 knowledge items', '10 connectors', '5,000 queries / month', 'Up to 50 users', 'Priority support']}
            highlighted
          />
          <PlanCard
            name="Business"
            price={399}
            period="month"
            features={['100,000 knowledge items', 'Unlimited connectors', 'Unlimited queries', 'Up to 200 users', 'SSO / SAML']}
          />
          <PlanCard
            name="Enterprise"
            price={null}
            period="month"
            features={['Unlimited everything', 'On-premise deployment', 'Custom SLA', 'Dedicated account manager', 'Advanced security']}
            ctaLabel="Contact sales"
          />
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment method</CardTitle>
          <CardDescription>Your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-lg border border-border p-4">
            <div className="flex h-10 w-14 items-center justify-center rounded bg-muted">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Visa ending in 4242</p>
              <p className="text-xs text-muted-foreground">Expires 12/2025</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: 'Jan 1, 2024', amount: '49.00', status: 'Paid' },
              { date: 'Dec 1, 2023', amount: '49.00', status: 'Paid' },
              { date: 'Nov 1, 2023', amount: '49.00', status: 'Paid' },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{invoice.date}</p>
                  <p className="text-xs text-muted-foreground">Starter plan</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">&euro;{invoice.amount}</span>
                  <Badge variant="success">{invoice.status}</Badge>
                  <Button variant="ghost" size="sm">Download</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
