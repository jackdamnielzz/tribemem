import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendAlertEmail, sendApiKeyNotification } from '@/lib/email/send';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      type: string;
      org_name?: string;
      alert_type?: string;
      alert_details?: string;
      key_name?: string;
    };

    const to = user.email;
    if (!to) {
      return NextResponse.json({ error: 'No email address' }, { status: 400 });
    }

    switch (body.type) {
      case 'welcome': {
        if (!body.org_name) {
          return NextResponse.json({ error: 'org_name required' }, { status: 400 });
        }
        const result = await sendWelcomeEmail(to, body.org_name);
        return NextResponse.json(result);
      }
      case 'alert': {
        if (!body.alert_type || !body.alert_details) {
          return NextResponse.json({ error: 'alert_type and alert_details required' }, { status: 400 });
        }
        const result = await sendAlertEmail(to, body.alert_type, body.alert_details);
        return NextResponse.json(result);
      }
      case 'api_key': {
        if (!body.key_name) {
          return NextResponse.json({ error: 'key_name required' }, { status: 400 });
        }
        const result = await sendApiKeyNotification(to, body.key_name);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: `Unknown email type: ${body.type}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[Email API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
