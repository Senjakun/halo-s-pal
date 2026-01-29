export interface Email {
  id: string;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  to: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';
  labels?: string[];
}

export const mockEmails: Email[] = [
  {
    id: '1',
    from: { name: 'Sarah Chen', email: 'sarah.chen@design.co' },
    to: 'me@example.com',
    subject: 'Q1 Design Review - Feedback Needed',
    preview: 'Hey! I just finished the mockups for the new dashboard. Would love to get your thoughts before the team meeting tomorrow...',
    body: `Hey!

I just finished the mockups for the new dashboard. Would love to get your thoughts before the team meeting tomorrow.

Key changes:
• Simplified navigation structure
• New color palette based on brand guidelines
• Improved data visualization components

Let me know if you have any questions!

Best,
Sarah`,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    isRead: false,
    isStarred: true,
    folder: 'inbox',
    labels: ['Design', 'Priority'],
  },
  {
    id: '2',
    from: { name: 'Marcus Johnson', email: 'marcus@startup.io' },
    to: 'me@example.com',
    subject: 'Partnership Opportunity',
    preview: 'I came across your work and I think there might be an interesting opportunity for collaboration...',
    body: `Hi there,

I came across your work and I think there might be an interesting opportunity for collaboration between our teams.

We're building a new platform that could benefit from your expertise. Would you be open to a quick call this week?

Best regards,
Marcus Johnson
CEO, Startup.io`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: false,
    isStarred: false,
    folder: 'inbox',
  },
  {
    id: '3',
    from: { name: 'GitHub', email: 'notifications@github.com' },
    to: 'me@example.com',
    subject: '[portal-app] Pull request merged',
    preview: 'Your pull request #142 has been merged into main. Great work on the email component refactor!',
    body: `Your pull request #142 has been merged into main.

Great work on the email component refactor! The code looks clean and well-documented.

View the changes: https://github.com/example/portal-app/pull/142

— GitHub`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isRead: true,
    isStarred: false,
    folder: 'inbox',
    labels: ['GitHub'],
  },
  {
    id: '4',
    from: { name: 'Alex Rivera', email: 'alex@company.com' },
    to: 'me@example.com',
    subject: 'Team lunch tomorrow?',
    preview: "Hey team! Anyone up for lunch at the new Thai place downtown? I heard it's amazing...",
    body: `Hey team!

Anyone up for lunch at the new Thai place downtown? I heard it's amazing and they have great vegetarian options too.

Thinking around 12:30pm. Let me know if you can make it!

Cheers,
Alex`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    isRead: true,
    isStarred: false,
    folder: 'inbox',
  },
  {
    id: '5',
    from: { name: 'Stripe', email: 'receipts@stripe.com' },
    to: 'me@example.com',
    subject: 'Your invoice from Acme Inc.',
    preview: 'Thanks for your payment of $49.00. Your receipt is attached below.',
    body: `Thanks for your payment!

Amount: $49.00
Date: Today
Description: Pro Plan - Monthly

Your receipt is attached below.

— Stripe`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
    isStarred: false,
    folder: 'inbox',
    labels: ['Receipts'],
  },
  {
    id: '6',
    from: { name: 'Emma Watson', email: 'emma.w@creative.agency' },
    to: 'me@example.com',
    subject: 'Brand Assets - Final Version',
    preview: 'Attached are the final brand assets we discussed. Let me know if you need any adjustments...',
    body: `Hi!

Attached are the final brand assets we discussed:

• Logo variations (light/dark)
• Color palette
• Typography guidelines
• Icon set

Let me know if you need any adjustments before we move forward with implementation.

Best,
Emma`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    isRead: true,
    isStarred: true,
    folder: 'inbox',
    labels: ['Design'],
  },
  {
    id: '7',
    from: { name: 'Me', email: 'me@example.com' },
    to: 'team@company.com',
    subject: 'Project Update - Week 12',
    preview: 'Quick update on the progress this week. We completed the authentication module and started on...',
    body: `Hi team,

Quick update on the progress this week:

✅ Completed the authentication module
✅ Fixed critical bugs in the dashboard
🔄 Started on the notification system

Next week we'll focus on finishing notifications and starting the mobile responsive design.

Let me know if you have any questions!`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    isRead: true,
    isStarred: false,
    folder: 'sent',
  },
  {
    id: '8',
    from: { name: 'Me', email: 'me@example.com' },
    to: 'client@business.com',
    subject: 'Proposal Draft',
    preview: 'Please find attached the proposal draft for the upcoming project. Looking forward to your feedback...',
    body: `Dear Client,

Please find attached the proposal draft for the upcoming project.

Key highlights:
• Timeline: 8 weeks
• Budget: As discussed
• Deliverables: Full design and development

Looking forward to your feedback.

Best regards`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    isRead: true,
    isStarred: false,
    folder: 'sent',
  },
];

export const folders = [
  { id: 'inbox', name: 'Inbox', icon: 'inbox', count: 6 },
  { id: 'sent', name: 'Sent', icon: 'send', count: 0 },
  { id: 'drafts', name: 'Drafts', icon: 'file-text', count: 2 },
  { id: 'archive', name: 'Archive', icon: 'archive', count: 0 },
  { id: 'trash', name: 'Trash', icon: 'trash-2', count: 0 },
];
