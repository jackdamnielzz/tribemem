'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/chat/chat-message';
import { SuggestionChips } from '@/components/chat/suggestion-chips';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    connector: 'slack' | 'notion' | 'jira' | 'github' | 'confluence' | 'other';
    title: string;
    url?: string;
  }>;
  timestamp: Date;
}

const initialSuggestions = [
  'What is our refund policy?',
  'How do we deploy to production?',
  'Who handles customer escalations?',
  'What are our code review standards?',
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text || input;
    if (!message.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    let assistantContent = '';
    let sources: Message['sources'] = undefined;

    try {
      const res = await fetch('/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        assistantContent = data.answer;
        if (data.sources && data.sources.length > 0) {
          sources = data.sources.map((s: { source_title?: string; source_url?: string; connector_type?: string }) => ({
            title: s.source_title || 'Unknown source',
            url: s.source_url,
            connector: s.connector_type || 'other',
          }));
        }
      } else {
        assistantContent = 'Something went wrong while querying. Please try again.';
      }
    } catch {
      assistantContent = 'Failed to connect to the server. Please try again.';
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: assistantContent,
      sources,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Send className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Ask your organization</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Query your team&apos;s collective knowledge. Get sourced answers backed by evidence from your connected tools.
              </p>
              <div className="mt-6">
                <SuggestionChips
                  suggestions={initialSuggestions}
                  onSelect={(suggestion) => handleSend(suggestion)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching organizational knowledge...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your organization..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
