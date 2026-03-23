import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'For individuals exploring knowledge management',
    features: [
      '500 knowledge items',
      '1 connector',
      '100 queries / month',
      '1 user',
      'Community support',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '49',
    description: 'For small teams getting started',
    features: [
      '5,000 knowledge items',
      '3 connectors',
      '1,000 queries / month',
      'Up to 10 users',
      'Email support',
      'Basic analytics',
    ],
    cta: 'Start trial',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '149',
    description: 'For growing teams with more integrations',
    features: [
      '25,000 knowledge items',
      '10 connectors',
      '5,000 queries / month',
      'Up to 50 users',
      'Priority support',
      'Advanced analytics',
      'Conflict detection',
      'API access',
    ],
    cta: 'Start trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '399',
    description: 'For organizations needing full coverage',
    features: [
      '100,000 knowledge items',
      'Unlimited connectors',
      'Unlimited queries',
      'Up to 200 users',
      'Dedicated support',
      'Custom integrations',
      'SSO / SAML',
      'Audit logs',
      'SLA guarantee',
    ],
    cta: 'Start trial',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited everything',
      'On-premise deployment',
      'Custom SLA',
      'Dedicated account manager',
      'Custom training',
      'Data residency options',
      'Advanced security',
      'Custom contract terms',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'What is a knowledge item?',
    answer:
      'A knowledge item is any piece of structured information that TribeMem extracts from your connected tools. This includes facts, processes, decisions, norms, and definitions. Each item is individually tracked with its own confidence score and source citations.',
  },
  {
    question: 'Can I upgrade or downgrade at any time?',
    answer:
      'Yes, you can change your plan at any time. When upgrading, you\'ll be charged the prorated difference for the remainder of your billing period. When downgrading, the change will take effect at the end of your current billing period.',
  },
  {
    question: 'What connectors are available?',
    answer:
      'We currently support Slack, Discord, Notion, Jira, GitHub, Intercom, Linear, Google Drive, HubSpot, Stripe, and Confluence. We\'re continuously adding new integrations based on customer feedback.',
  },
  {
    question: 'How does the crawler work?',
    answer:
      'Our AI-powered crawler continuously monitors your connected tools for new and updated content. It extracts knowledge items, categorizes them, assigns confidence scores, and detects conflicts with existing knowledge. The crawl frequency depends on your plan.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. All data is encrypted in transit and at rest. We use SOC 2 Type II compliant infrastructure. Enterprise plans include additional security features like SSO, audit logs, and data residency options.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'Yes, all paid plans come with a 14-day free trial. No credit card is required to start. You can also use our Free plan indefinitely with limited features.',
  },
];

export default function PricingPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, scale as your team grows. All prices in USD.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mt-16 grid gap-6 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.highlighted
                  ? 'border-primary shadow-lg shadow-primary/10'
                  : 'border-border'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.price === 'Custom' ? (
                    <span className="text-3xl font-bold">Custom</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.price === 'Custom' ? '/contact' : '/signup'}>
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-center text-3xl font-bold">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
