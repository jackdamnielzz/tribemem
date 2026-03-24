'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { docsContent } from '@/lib/docs/content';
import { findDocBySlug, getFirstDocPath, getAdjacentPages } from '@/lib/docs/navigation';

export default function DocsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string[] | undefined) ?? [];

  // Root /docs → redirect to first page
  if (slug.length === 0) {
    if (typeof window !== 'undefined') {
      router.replace(getFirstDocPath());
    }
    return null;
  }

  const doc = findDocBySlug(slug);

  if (!doc) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Pagina niet gevonden</h1>
        <p className="mt-2 text-muted-foreground">
          Deze documentatiepagina bestaat niet.
        </p>
        <Link href={getFirstDocPath()} className="mt-4 inline-block text-primary hover:underline">
          Ga naar de documentatie
        </Link>
      </div>
    );
  }

  const Content = docsContent[slug[0]]?.[slug[1]];
  const { prev, next } = getAdjacentPages(slug);

  if (!Content) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Inhoud wordt nog geschreven</h1>
        <p className="mt-2 text-muted-foreground">
          Deze pagina is binnenkort beschikbaar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {doc.section.title}
        </span>
      </div>
      <h1 className="mb-6 text-3xl font-bold">{doc.page.title}</h1>

      <Content />

      {/* Prev / Next navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
        {prev ? (
          <Link
            href={prev.path}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {prev.title}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.path}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {next.title}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </>
  );
}
