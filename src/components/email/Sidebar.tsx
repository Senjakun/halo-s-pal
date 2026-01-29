import { Inbox, Send, FileText, Archive, Trash2, Star, Tag, ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const iconMap = {
  inbox: Inbox,
  send: Send,
  'file-text': FileText,
  archive: Archive,
  'trash-2': Trash2,
};

interface SidebarProps {
  folders: Array<{ id: string; name: string; icon: string; count: number }>;
  activeFolder: string;
  onFolderChange: (folderId: string) => void;
  userEmail: string;
  onBack: () => void;
  onRefresh: () => void;
}

export function Sidebar({ folders, activeFolder, onFolderChange, userEmail, onBack, onRefresh }: SidebarProps) {
  const emailDomain = userEmail.split('@')[1] || '';
  const emailName = userEmail.split('@')[0] || '';

  return (
    <aside className="w-64 bg-email-sidebar text-email-sidebar-foreground flex flex-col h-full">
      <div className="p-4 space-y-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full justify-start gap-2 text-email-sidebar-foreground/80 hover:text-email-sidebar-foreground hover:bg-email-sidebar-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        
        <Button
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {folders.map((folder) => {
            const Icon = iconMap[folder.icon as keyof typeof iconMap] || Inbox;
            const isActive = activeFolder === folder.id;

            return (
              <button
                key={folder.id}
                onClick={() => onFolderChange(folder.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-email-sidebar-active text-white'
                    : 'text-email-sidebar-foreground/80 hover:bg-email-sidebar-hover hover:text-email-sidebar-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{folder.name}</span>
                {folder.count > 0 && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    isActive ? 'bg-white/20' : 'bg-email-sidebar-hover'
                  )}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-email-sidebar-muted uppercase tracking-wider mb-2">
            Labels
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => onFolderChange('starred')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                activeFolder === 'starred'
                  ? 'bg-email-sidebar-active text-white'
                  : 'text-email-sidebar-foreground/80 hover:bg-email-sidebar-hover'
              )}
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Starred</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-email-sidebar-foreground/80 hover:bg-email-sidebar-hover transition-colors">
              <Tag className="h-4 w-4 text-emerald-500" />
              <span>Priority</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-email-sidebar-hover">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium text-sm">
            {emailName[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{emailName}</p>
            <p className="text-xs text-email-sidebar-muted truncate">@{emailDomain}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
