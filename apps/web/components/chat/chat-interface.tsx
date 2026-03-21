'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const mockResponse: Omit<Message, 'id' | 'timestamp'> = {
  role: 'assistant',
  content: `Based on the organizational knowledge I've found, here's what I know:

**Enterprise Refund Policy**

The enterprise refund window is **30 days** from the date of purchase. This policy was established in the Q3 2023 policy review and has been referenced across multiple sources.

Key details:
- Refunds must be initiated by the customer through their account manager
- Partial refunds are available for unused portion of annual contracts
- Processing takes 5-10 business days after approval
- Refunds for custom integrations follow a separate process

**Confidence: 95%** - This information was last confirmed on January 15, 2024 from 4 independent sources.

> Note: There is a potential conflict flagged - a recent Slack message from the support team mentions a "60-day window" for specific cases. This may warrant review.`,
  sources: [
    { connector: 'notion', title: 'Refund Policy Documentation', url: '#' },
    { connector: 'slack', title: '#policy-updates - Jan 10 discussion', url: '#' },
    { connector: 'jira', title: 'POLICY-234: Q3 Policy Review', url: '#' },
    { connector: 'confluence', title: 'Customer Success Handbook', url: '#' },
  ],
};

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

    // Simulate API response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      ...mockResponse,
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

      {/* Follow-up suggestions */}
      {messages.length > 0 && !loading && (
        <div className="border-t border-border px-6 py-3">
          <SuggestionChips
            suggestions={[
              'Tell me more about the exceptions',
              'What is the process for annual contracts?',
              'Who should I contact about this?',
            ]}
            onSelect={(suggestion) => handleSend(suggestion)}
          />
        </div>
      )}

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
