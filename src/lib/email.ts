/**
 * Simulated Email Logic
 * In a real production app, this would trigger a Firebase Cloud Function 
 * or call an external API like SendGrid or AWS SES.
 */

export async function sendSimulatedEmail(to: string, subject: string, body: string) {
  console.group('📧 SIMULATED EMAIL SENT');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  console.groupEnd();
  
  // Real implementation would be something like:
  // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify({ to, subject, body }) });
}

export const EMAIL_TEMPLATES = {
  TASK_APPROVED: (taskTitle: string, amount: number) => ({
    subject: `Payment Confirmed: ${taskTitle}`,
    body: `Congratulations! Your submission for "${taskTitle}" was approved. ${amount} coins have been added to your balance.`
  }),
  TASK_REJECTED: (taskTitle: string, reason?: string) => ({
    subject: `Update on your task submission: ${taskTitle}`,
    body: `Your submission for "${taskTitle}" was unfortunately rejected. ${reason ? `Reason: ${reason}` : ''}`
  }),
  WITHDRAWAL_APPROVED: (amount: number) => ({
    subject: `Withdrawal Successful`,
    body: `Your withdrawal request for ${amount} coins has been processed and approved.`
  })
};
