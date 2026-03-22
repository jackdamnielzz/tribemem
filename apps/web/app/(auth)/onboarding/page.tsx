'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgSlug,
          plan: 'free',
          owner_id: user.id,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.code === '23505') {
          toast({ title: 'Error', description: 'An organization with this slug already exists.', variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: orgError.message, variant: 'destructive' });
        }
        return;
      }

      // Add the user as owner member
      const { error: memberError } = await supabase.from('members').insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
      });

      if (memberError) {
        toast({ title: 'Error', description: memberError.message, variant: 'destructive' });
        return;
      }

      // Send welcome email (fire-and-forget)
      fetch('/api/internal/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'welcome', org_name: orgName }),
      }).catch(() => {});

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
