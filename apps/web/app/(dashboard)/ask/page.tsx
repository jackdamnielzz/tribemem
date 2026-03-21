'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';

export default function AskPage() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Ask</h1>
        <p className="text-muted-foreground">
          Query your organization&apos;s knowledge base in natural language
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
