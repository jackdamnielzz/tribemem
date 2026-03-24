'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { docsNavigation } from '@/lib/docs/navigation';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Docs sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card/50">
        <ScrollArea className="h-full px-4 py-6">
          <h2 className="mb-4 px-2 text-lg font-semibold">Documentation</h2>
          <nav className="flex flex-col gap-1">
            {docsNavigation.map((section) => (
              <div key={section.slug} className="mb-3">
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {section.pages.map((page) => {
                    const href = `/docs/${section.slug}/${page.slug}`;
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={page.slug}
                        href={href}
                        className={cn(
                          'rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/10 hover:text-foreground',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground'
                        )}
                      >
                        {page.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">{children}</div>
      </div>
    </div>
  );
}
