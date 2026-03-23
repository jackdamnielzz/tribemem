import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { orgName, orgSlug } = await request.json();

  if (!orgName || !orgSlug) {
    return NextResponse.json({ error: 'Organization name and slug are required' }, { status: 400 });
  }

  // Get the current user from the session
  const supabaseAuth = createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use service role to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create the organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: orgName,
      slug: orgSlug,
      plan: 'free',
    })
    .select()
    .single();

  if (orgError) {
    if (orgError.code === '23505') {
      return NextResponse.json({ error: 'An organization with this slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: orgError.message }, { status: 400 });
  }

  // Add the user as owner member
  const { error: memberError } = await supabaseAdmin.from('members').insert({
    org_id: org.id,
    user_id: user.id,
    role: 'owner',
  });

  if (memberError) {
    // Rollback: delete the org if member creation fails
    await supabaseAdmin.from('organizations').delete().eq('id', org.id);
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  return NextResponse.json({ organization: org });
}
