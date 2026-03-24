import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Check if there are any knowledge units to search
    const { count } = await supabase
      .from('knowledge_units')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', member.organization_id)
      .eq('status', 'active');

    if (!count || count === 0) {
      // Log the query
      const { data: queryRecord } = await supabase
        .from('queries')
        .insert({
          org_id: member.organization_id,
          user_id: user.id,
          query_text: query,
          query_type: 'chat',
          response_text: 'No knowledge available yet. Connect a source and run the crawler to populate your organizational knowledge.',
          confidence_score: 0,
        })
        .select('id, created_at')
        .single();

      return NextResponse.json({
        id: queryRecord?.id,
        query,
        answer: 'No knowledge available yet. Connect a source and run the crawler to populate your organizational knowledge.',
        confidence: 0,
        sources: [],
        suggestions: [],
        created_at: queryRecord?.created_at || new Date().toISOString(),
      });
    }

    // TODO: Implement real AI-powered search (vector similarity + LLM synthesis)
    // For now, do a basic text search across knowledge units
    const { data: matches } = await supabase
      .from('knowledge_units')
      .select('id, title, content, type, confidence_score')
      .eq('org_id', member.organization_id)
      .eq('status', 'active')
      .textSearch('title', query.split(' ').join(' | '), { type: 'plain' })
      .limit(5);

    const answer = matches && matches.length > 0
      ? matches.map(m => `**${m.title}**\n${m.content}`).join('\n\n')
      : 'No matching knowledge found for your query. Try rephrasing or check that relevant sources have been connected and crawled.';

    const confidence = matches && matches.length > 0
      ? Math.max(...matches.map(m => Number(m.confidence_score)))
      : 0;

    // Log the query
    const { data: queryRecord } = await supabase
      .from('queries')
      .insert({
        org_id: member.organization_id,
        user_id: user.id,
        query_text: query,
        query_type: 'chat',
        response_text: answer,
        knowledge_units_used: (matches || []).map(m => m.id),
        confidence_score: confidence,
      })
      .select('id, created_at')
      .single();

    // Fetch sources for matched knowledge units
    const knowledgeIds = (matches || []).map(m => m.id);
    const { data: sources } = knowledgeIds.length > 0
      ? await supabase
          .from('sources')
          .select('id, knowledge_unit_id, source_url, source_title, source_snippet')
          .in('knowledge_unit_id', knowledgeIds)
      : { data: [] };

    return NextResponse.json({
      id: queryRecord?.id,
      query,
      answer,
      confidence,
      sources: sources || [],
      suggestions: [],
      created_at: queryRecord?.created_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
