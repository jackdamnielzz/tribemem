import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  Bot,
  MessageCircle,
  Plug,
  Shield,
  Zap,
  Search,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const connectors = [
  { name: 'Slack', color: 'bg-[#4A154B]' },
  { name: 'Notion', color: 'bg-[#000000]' },
  { name: 'Jira', color: 'bg-[#0052CC]' },
  { name: 'GitHub', color: 'bg-[#24292F]' },
  { name: 'Discord', color: 'bg-[#5865F2]' },
  { name: 'Intercom', color: 'bg-[#1F8DED]' },
  { name: 'Linear', color: 'bg-[#5E6AD2]' },
  { name: 'Google Drive', color: 'bg-[#4285F4]' },
  { name: 'HubSpot', color: 'bg-[#FF7A59]' },
  { name: 'Confluence', color: 'bg-[#1868DB]' },
  { name: 'Stripe', color: 'bg-[#635BFF]' },
];

const features = [
  {
    icon: Brain,
    title: 'Structured Knowledge',
    description: 'Automatically categorizes knowledge into facts, processes, decisions, and norms with confidence scoring.',
  },
  {
    icon: Bot,
    title: 'Intelligent Crawler',
    description: 'Continuously monitors your connected tools to discover, extract, and validate organizational knowledge.',
  },
  {
    icon: MessageCircle,
    title: 'Natural Language Q&A',
    description: 'Ask questions in plain English and get answers backed by sources with full citation trails.',
  },
  {
    icon: Shield,
    title: 'Conflict Detection',
    description: 'Automatically identifies contradictions and outdated information across your knowledge base.',
  },
  {
    icon: RefreshCw,
    title: 'Always Current',
    description: 'Knowledge confidence decays over time, prompting revalidation to keep your information fresh.',
  },
  {
    icon: Plug,
    title: 'Deep Integrations',
    description: 'Connect to Slack, Notion, Jira, GitHub, and more. Your knowledge lives where your team works.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Connect',
    description: 'Link your existing tools in minutes. Slack, Notion, Jira, GitHub, and more.',
    icon: Plug,
  },
  {
    number: '02',
    title: 'Crawl',
    description: 'Our AI crawler automatically discovers and structures your organizational knowledge.',
    icon: Search,
  },
  {
    number: '03',
    title: 'Query',
    description: 'Ask questions and get precise, sourced answers from your team\'s collective intelligence.',
    icon: MessageCircle,
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <Zap className="mr-2 h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Now in public beta</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your team&apos;s knowledge,{' '}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                always current
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              TribeMem automatically captures, structures, and delivers your organization&apos;s
              collective intelligence. Stop losing knowledge in chat threads and docs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="ml-4 text-xs text-muted-foreground">app.tribemem.com</span>
              </div>
              <div className="grid grid-cols-4 gap-4 p-6">
                {['Total Knowledge', 'Active Connectors', 'Queries This Week', 'Confidence Score'].map(
                  (label, i) => (
                    <div key={label} className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-2xl font-bold">
                        {['2,847', '6', '342', '94%'][i]}
                      </p>
                    </div>
                  )
                )}
              </div>
              <div className="border-t border-border p-6">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Ask anything about your organization...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-t border-border bg-card/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-destructive">The Problem</h2>
              <h3 className="mt-2 text-3xl font-bold">Your knowledge is scattered and decaying</h3>
              <ul className="mt-6 space-y-4">
                {[
                  'Critical decisions buried in Slack threads',
                  'Outdated processes in forgotten Notion pages',
                  'Onboarding takes months because knowledge is tribal',
                  'No one knows what the team actually agreed on',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-500">The Solution</h2>
              <h3 className="mt-2 text-3xl font-bold">TribeMem keeps your knowledge alive</h3>
              <ul className="mt-6 space-y-4">
                {[
                  'Automatically extracts knowledge from all your tools',
                  'Structures it into facts, processes, decisions, and norms',
                  'Tracks confidence and freshness with decay scoring',
                  'Answers questions with sourced, cited responses',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <span className="mt-4 block text-sm font-medium text-primary">{step.number}</span>
                  <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete platform for organizational knowledge management
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Connectors */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Connects to your stack</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Integrate with the tools your team already uses
            </p>
          </div>
          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-4">
            {connectors.map((connector) => (
              <div
                key={connector.name}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2"
              >
                <div className={`h-4 w-4 rounded ${connector.color}`} />
                <span className="text-sm font-medium">{connector.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/50 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Ready to capture your team&apos;s knowledge?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start for free and connect your first tool in under 5 minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Free plan includes 500 knowledge items.
          </p>
        </div>
      </section>
    </div>
  );
}
