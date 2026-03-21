'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
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
          .from('organization_members')
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
