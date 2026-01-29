import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/email/Sidebar';
import { EmailList } from '@/components/email/EmailList';
import { EmailDetail } from '@/components/email/EmailDetail';
import { SearchBar } from '@/components/email/SearchBar';
import { useEmailsByAddress, Email } from '@/hooks/useEmails';
import { folders } from '@/data/mockEmails';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Inbox = () => {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const decodedEmail = email ? decodeURIComponent(email) : '';
  
  const { emails, loading, toggleStar, markAsRead, moveToFolder, deleteEmail, refetch } = useEmailsByAddress(decodedEmail);

  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const foldersWithCounts = folders.map(folder => ({
    ...folder,
    count: folder.id === 'inbox'
      ? emails.filter(e => e.folder === 'inbox' && !e.isRead).length
      : emails.filter(e => e.folder === folder.id).length
  }));

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar
        folders={foldersWithCounts}
        activeFolder={activeFolder}
        onFolderChange={(folder) => {
          setActiveFolder(folder);
          setSelectedEmail(null);
        }}
        userEmail={decodedEmail}
        onBack={() => navigate('/')}
        onRefresh={refetch}
      />

      <div className="flex-1 flex flex-col border-l border-border">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="w-96 border-r border-border flex flex-col">
            {loading ? (
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
    </div>
  );
};

export default Inbox;
