'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Member {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export function useMember() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMember() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error: memberError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (memberError) throw memberError;

        setMember(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch member'));
      } finally {
        setLoading(false);
      }
    }

    fetchMember();
  }, []);

  const isOwner = member?.role === 'owner';
  const isAdmin = member?.role === 'admin' || isOwner;

  return { member, loading, error, isOwner, isAdmin };
}
