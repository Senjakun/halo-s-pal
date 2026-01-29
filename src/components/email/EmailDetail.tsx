import { Reply, Forward, MoreHorizontal, Star, Archive, Trash2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Email } from '@/hooks/useEmails';
import { format } from 'date-fns';

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onToggleStar: (emailId: string) => void;
  onArchive: (emailId: string) => void;
  onDelete: (emailId: string) => void;
}

export function EmailDetail({ email, onBack, onToggleStar, onArchive, onDelete }: EmailDetailProps) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card text-muted-foreground">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-medium">Select an email to read</p>
          <p className="text-sm mt-1">Choose from your inbox on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1">
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <Reply className="h-5 w-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <Forward className="h-5 w-5" />
          </button>
          <button
            onClick={() => onToggleStar(email.id)}
            className="p-2 text-muted-foreground hover:text-yellow-500 hover:bg-muted rounded-lg transition-colors"
          >
            <Star className={cn('h-5 w-5', email.isStarred && 'fill-yellow-500 text-yellow-500')} />
          </button>
          <button
            onClick={() => onArchive(email.id)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Archive className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(email.id)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <h1 className="text-xl font-semibold text-foreground mb-6">
          {email.subject}
        </h1>

        <div className="flex items-start gap-4 mb-6">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium text-sm shrink-0">
            {email.from.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-medium text-foreground">{email.from.name}</span>
                <span className="text-muted-foreground ml-2 text-sm">&lt;{email.from.email}&gt;</span>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {format(email.timestamp, 'MMM d, yyyy \'at\' h:mm a')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              to {email.to.email}
            </p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {email.body}
          </div>
        </div>

        {email.labels && email.labels.length > 0 && (
          <div className="flex gap-2 mt-8 pt-6 border-t border-border">
            {email.labels.map((label) => (
              <span
                key={label}
                className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Reply Box */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
          <Reply className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Click here to reply...</span>
        </div>
      </div>
    </div>
  );
}
