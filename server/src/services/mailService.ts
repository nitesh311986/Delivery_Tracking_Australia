import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

export interface DispatchEmailInput {
  to: string | string[];
  subject?: string;
  pdfBuffer: Buffer;
  filename?: string;
  runsheetDate?: string;
  driverName?: string;
}

function getResendClient(): Resend | undefined {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn('RESEND_API_KEY is not configured; email dispatch disabled');
    return undefined;
  }
  return new Resend(apiKey);
}

export async function sendRunsheetPdf(input: DispatchEmailInput): Promise<{ emailId: string }> {
  const client = getResendClient();
  if (!client) {
    throw new Error('Resend is not configured; set RESEND_API_KEY to dispatch PDFs');
  }

  const to = Array.isArray(input.to) ? input.to : input.to.split(',').map((s) => s.trim());
  const subject =
    input.subject ??
    `Velocity Taxi Trucks Runsheet ${input.driverName ? `- ${input.driverName} ` : ''}${
      input.runsheetDate ? `(${input.runsheetDate})` : ''
    }`;
  const filename = input.filename ?? `runsheet-${input.runsheetDate ?? 'report'}.pdf`;

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || 'Velocity Taxi Trucks <onboarding@resend.dev>';
  const developerEmail =
    process.env.RESEND_FALLBACK_EMAIL ??
    process.env.DEVELOPER_EMAIL ??
    'nitesh.barot31@gmail.com';

  // A custom verified domain is configured when RESEND_FROM_EMAIL points at a
  // non-resend.dev address, or when RESEND_VERIFIED_DOMAIN is explicitly set.
  const isProduction = process.env.NODE_ENV === 'production';
  const hasVerifiedDomain =
    Boolean(process.env.RESEND_VERIFIED_DOMAIN) ||
    (Boolean(process.env.RESEND_FROM_EMAIL) && !fromEmail.includes('resend.dev'));

  // In test mode without a verified domain, Resend only permits sending to the
  // account owner's registered address. Redirect and log a clear warning.
  let sentTo = to;
  if (!isProduction && !hasVerifiedDomain) {
    logger.warn(
      `[Resend Notice]: Domain not verified yet. Redirecting dispatch from ${to.join(', ')} to verified account ${developerEmail}.`
    );
    sentTo = [developerEmail];
  }

  const send = async (recipients: string[]) =>
    client.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html: `<p>Please find the attached Velocity Taxi Trucks runsheet.</p>
             ${input.driverName ? `<p>Driver: <strong>${input.driverName}</strong></p>` : ''}
             ${input.runsheetDate ? `<p>Shift Date: <strong>${input.runsheetDate}</strong></p>` : ''}
             <p>If you have any questions, please contact the depot.</p>`,
      attachments: [
        {
          filename,
          content: input.pdfBuffer.toString('base64'),
        },
      ],
    });

  let { data, error } = await send(sentTo);

  // Fallback: if Resend still rejects due to an unverified domain, retry once
  // against the authorized developer address.
  if (
    error &&
    (typeof error === 'string' ? error : (error.message ?? '')).includes('domain is not verified')
  ) {
    logger.warn(
      `[Resend Notice]: Domain not verified yet. Redirecting dispatch from ${sentTo.join(', ')} to verified account ${developerEmail}.`
    );
    sentTo = [developerEmail];
    ({ data, error } = await send(sentTo));
  }

  if (error) {
    logger.error('Resend dispatch failed', { error });
    throw new Error(
      typeof error === 'string' ? error : (error.message ?? 'Resend dispatch failed')
    );
  }

  if (!data?.id) {
    throw new Error('Resend did not return an email ID');
  }

  logger.info('Runsheet PDF dispatched', { id: data.id, to: sentTo });
  return { emailId: data.id };
}
