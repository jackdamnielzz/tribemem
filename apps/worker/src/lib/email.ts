import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_ADDRESS = 'TribeMem <notifications@tribemem.com>';

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set, skipping email');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Send failed:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Email] Error:', err instanceof Error ? err.message : err);
    return false;
  }
}
