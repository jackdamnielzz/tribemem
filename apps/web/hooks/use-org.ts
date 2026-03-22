'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  usage_this_period: {
    crawl_events: number;
    extractions: number;
    queries: number;
    api_calls: number;
    tokens_used: number;
  };
  usage_reset_at: string;
  created_at: string;
}

export function useOrg() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOrg() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data: member, error: memberError } = await supabase
          .from('members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (memberError) throw memberError;

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', member.organization_id)
          .single();

        if (orgError) throw orgError;

        setOrg(org);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch organization'));
      } finally {
        setLoading(false);
      }
    }

    fetchOrg();
  }, []);

  return { org, loading, error };
}
