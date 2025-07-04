// Placeholder SMS helper – implement real SMS sending with provider of your choice

/**
 * Send SMS via Twilio (noop if credentials missing)
 */
export async function sendSMS(to: string, body: string): Promise<void> {
  console.info('sendSMS noop', { to, body })
}
