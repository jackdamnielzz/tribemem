'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 48);
  };

  const handleNameChange = (name: string) => {
    setOrgName(name);
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, orgSlug }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'Organization created', description: `Welcome to ${orgName}!` });
      router.push('/overview');
      router.refresh();
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your organization</CardTitle>
        <CardDescription>Set up your workspace to start crawling knowledge</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              placeholder="Acme Inc."
              value={orgName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">URL slug</Label>
            <Input
              id="org-slug"
              placeholder="acme-inc"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
              pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
              title="Lowercase letters, numbers, and hyphens only"
              required
            />
            <p className="text-xs text-muted-foreground">Used in URLs and API calls</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What does your team do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !orgName || !orgSlug}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create organization
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
