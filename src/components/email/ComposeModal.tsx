import { X, Minus, Maximize2, Paperclip, Image, Link, Smile, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
}

export function ComposeModal({ isOpen, onClose, onSend }: ComposeModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error('Please enter a recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setIsSending(true);
    try {
      await onSend(to, subject, body);
      // Reset form on success
      setTo('');
      setSubject('');
      setBody('');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setTo('');
    setSubject('');
    setBody('');
    onClose();
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 right-6 w-[520px] bg-card rounded-t-xl shadow-2xl border border-border overflow-hidden animate-slide-in z-50',
        isMinimized ? 'h-12' : 'h-[480px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-email-sidebar text-email-sidebar-foreground">
        <h3 className="font-medium text-sm">New Message</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-email-sidebar-hover rounded transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-email-sidebar-hover rounded transition-colors">
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-email-sidebar-hover rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Form */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border">
              <input
                type="email"
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              />
            </div>
            <div className="border-b border-border">
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              />
            </div>
            <textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-sm leading-relaxed h-[280px]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </button>
              <div className="flex items-center gap-1">
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                  <Image className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                  <Link className="h-4 w-4" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                  <Smile className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
