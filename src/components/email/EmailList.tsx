import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Email } from '@/hooks/useEmails';
import { formatDistanceToNow } from 'date-fns';

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (email: Email) => void;
  onToggleStar: (emailId: string) => void;
}

export function EmailList({ emails, selectedEmailId, onSelectEmail, onToggleStar }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>No emails in this folder</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {emails.map((email, index) => (
        <div
          key={email.id}
          onClick={() => onSelectEmail(email)}
          className={cn(
            'group px-4 py-3 border-b border-border cursor-pointer transition-all duration-150 animate-fade-in',
            selectedEmailId === email.id
              ? 'bg-email-selected'
              : 'hover:bg-email-list-hover',
            !email.isRead && 'bg-card'
          )}
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(email.id);
              }}
              className="mt-1 text-muted-foreground hover:text-yellow-500 transition-colors"
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  email.isStarred && 'fill-yellow-500 text-yellow-500'
                )}
              />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={cn(
                  'text-sm truncate',
                  !email.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
                )}>
                  {email.from.name}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(email.timestamp, { addSuffix: false })}
                </span>
              </div>

              <p className={cn(
                'text-sm truncate mb-1',
                !email.isRead ? 'font-medium text-foreground' : 'text-foreground/80'
              )}>
                {email.subject}
              </p>

              <p className="text-sm text-muted-foreground truncate">
                {email.preview}
              </p>

              {email.labels && email.labels.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {email.labels.map((label) => (
                    <span
                      key={label}
                      className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!email.isRead && (
              <div className="mt-2">
                <div className="h-2 w-2 rounded-full bg-email-unread" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
