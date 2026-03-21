import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle Slack URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle Slack events
    if (body.type === 'event_callback') {
      const event = body.event;

      switch (event.type) {
        case 'message': {
          // Handle new message in channel
          // Queue for knowledge extraction
          console.log('New Slack message:', event.channel, event.ts);
          break;
        }
        case 'message_changed': {
          // Handle edited message
          // Re-extract knowledge
          console.log('Slack message edited:', event.channel, event.message?.ts);
          break;
        }
        case 'channel_created': {
          // Handle new channel
          // Optionally auto-subscribe
          console.log('New Slack channel:', event.channel?.name);
          break;
        }
        case 'app_mention': {
          // Handle direct mentions of the bot
          // Could trigger knowledge query
          console.log('Bot mentioned in:', event.channel);
          break;
        }
        default:
          console.log(`Unhandled Slack event type: ${event.type}`);
      }
    }

    // Handle Slack interactive actions (button clicks, etc.)
    if (body.type === 'interactive_message' || body.type === 'block_actions') {
      console.log('Slack interactive action:', body.actions?.[0]?.action_id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
