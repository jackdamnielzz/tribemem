'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageCircle,
  Brain,
  Plug,
  Bot,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  GitBranch,
  Scale,
  BookOpen,
  CreditCard,
  Key,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Ask', href: '/ask', icon: MessageCircle },
  {
    label: 'Knowledge',
    href: '/knowledge/facts',
    icon: Brain,
    children: [
      { label: 'Facts', href: '/knowledge/facts' },
      { label: 'Processes', href: '/knowledge/processes' },
      { label: 'Decisions', href: '/knowledge/decisions' },
      { label: 'Norms', href: '/knowledge/norms' },
    ],
  },
  { label: 'Connectors', href: '/connectors', icon: Plug },
  { label: 'Crawler', href: '/crawler', icon: Bot },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Docs', href: '/docs/aan-de-slag/welkom', icon: BookOpen },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { label: 'General', href: '/settings' },
      { label: 'Billing', href: '/settings/billing' },
      { label: 'API Keys', href: '/api-keys' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Knowledge', 'Settings']);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    // For docs, match any /docs/* path
    if (href.startsWith('/docs/')) return pathname?.startsWith('/docs') ?? false;
    return pathname === href || pathname?.startsWith(href + '/') || false;
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">TribeMem</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.label);
            const isItemActive = hasChildren
              ? item.children!.some((child) => isActive(child.href))
              : isActive(item.href);

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/10 hover:text-foreground',
                      isItemActive
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/10 hover:text-foreground',
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )}

                {hasChildren && isExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-border pl-3">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-accent/10 hover:text-foreground',
                          isActive(child.href)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-primary/5 p-3">
          <p className="text-xs font-medium text-primary">Starter Plan</p>
          <p className="mt-1 text-xs text-muted-foreground">1,247 / 5,000 knowledge items</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
            <div className="h-full w-1/4 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
}
