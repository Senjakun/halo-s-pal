import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/email/Sidebar';
import { EmailList } from '@/components/email/EmailList';
import { EmailDetail } from '@/components/email/EmailDetail';
import { SearchBar } from '@/components/email/SearchBar';
import { ComposeModal } from '@/components/email/ComposeModal';
import { useAuth } from '@/hooks/useAuth';
import { useEmails, Email } from '@/hooks/useEmails';
import { folders } from '@/data/mockEmails';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { emails, loading: emailsLoading, toggleStar, markAsRead, moveToFolder, deleteEmail, sendEmail } = useEmails();

  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const filteredEmails = useMemo(() => {
    return emails
      .filter(email => {
        const matchesFolder = activeFolder === 'starred'
          ? email.isStarred
          : email.folder === activeFolder;

        const matchesSearch = searchQuery === '' ||
          email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.from.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.preview.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFolder && matchesSearch;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [emails, activeFolder, searchQuery]);

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      await markAsRead(email.id);
    }
  };

  const handleToggleStar = async (emailId: string) => {
    await toggleStar(emailId);
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
    }
  };

  const handleArchive = async (emailId: string) => {
    await moveToFolder(emailId, 'archive');
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  const handleDelete = async (emailId: string) => {
    await deleteEmail(emailId);
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    const result = await sendEmail(to, subject, body);
    if (!result.error) {
      setIsComposeOpen(false);
    }
  };

  const foldersWithCounts = folders.map(folder => ({
    ...folder,
    count: folder.id === 'inbox'
      ? emails.filter(e => e.folder === 'inbox' && !e.isRead).length
      : emails.filter(e => e.folder === folder.id).length
  }));

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar
        folders={foldersWithCounts}
        activeFolder={activeFolder}
        onFolderChange={(folder) => {
          setActiveFolder(folder);
          setSelectedEmail(null);
        }}
        onCompose={() => setIsComposeOpen(true)}
        userEmail={user.email || ''}
        userName={user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
      />

      <div className="flex-1 flex flex-col border-l border-border">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="w-96 border-r border-border flex flex-col">
            {emailsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <EmailList
                emails={filteredEmails}
                selectedEmailId={selectedEmail?.id || null}
                onSelectEmail={handleSelectEmail}
                onToggleStar={handleToggleStar}
              />
            )}
          </div>

          <EmailDetail
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onToggleStar={handleToggleStar}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
      />
    </div>
  );
};

export default Index;
