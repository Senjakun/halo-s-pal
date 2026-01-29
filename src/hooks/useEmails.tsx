import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Email {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: {
    name: string;
    email: string;
  };
  subject: string;
  body: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  labels?: string[];
}

interface DbEmail {
  id: string;
  from_name: string;
  from_email: string;
  to_name: string | null;
  to_email: string;
  subject: string;
  body: string;
  preview: string | null;
  timestamp: string;
  is_read: boolean;
  is_starred: boolean;
  folder: string;
  labels: string[];
}

// API base URL - uses relative path for same-origin requests
const API_BASE = '/api';

function transformEmail(dbEmail: DbEmail): Email {
  return {
    id: dbEmail.id,
    from: {
      name: dbEmail.from_name,
      email: dbEmail.from_email,
    },
    to: {
      name: dbEmail.to_name || '',
      email: dbEmail.to_email,
    },
    subject: dbEmail.subject,
    body: dbEmail.body,
    preview: dbEmail.preview || dbEmail.body.substring(0, 100),
    timestamp: new Date(dbEmail.timestamp),
    isRead: dbEmail.is_read,
    isStarred: dbEmail.is_starred,
    folder: dbEmail.folder,
    labels: dbEmail.labels || [],
  };
}

export function useEmailsByAddress(emailAddress: string) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = useCallback(async () => {
    if (!emailAddress) {
      setEmails([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/emails?to_email=${encodeURIComponent(emailAddress.toLowerCase())}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data: DbEmail[] = await response.json();
      setEmails(data.map(transformEmail));
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  }, [emailAddress]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const toggleStar = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    try {
      const response = await fetch(`${API_BASE}/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !email.isStarred })
      });

      if (!response.ok) throw new Error('Failed to update');

      setEmails(prev =>
        prev.map(e =>
          e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
        )
      );
    } catch (error) {
      console.error('Error toggling star:', error);
      toast.error('Failed to update email');
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      const response = await fetch(`${API_BASE}/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      });

      if (!response.ok) throw new Error('Failed to update');

      setEmails(prev =>
        prev.map(e =>
          e.id === emailId ? { ...e, isRead: true } : e
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const moveToFolder = async (emailId: string, folder: string) => {
    try {
      const response = await fetch(`${API_BASE}/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder })
      });

      if (!response.ok) throw new Error('Failed to update');

      setEmails(prev =>
        prev.map(e =>
          e.id === emailId ? { ...e, folder } : e
        )
      );
      toast.success(`Moved to ${folder}`);
    } catch (error) {
      console.error('Error moving email:', error);
      toast.error('Failed to move email');
    }
  };

  const deleteEmail = async (emailId: string) => {
    try {
      const response = await fetch(`${API_BASE}/emails/${emailId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');

      setEmails(prev => prev.filter(e => e.id !== emailId));
      toast.success('Email deleted');
    } catch (error) {
      console.error('Error deleting email:', error);
      toast.error('Failed to delete email');
    }
  };

  return {
    emails,
    loading,
    refetch: fetchEmails,
    toggleStar,
    markAsRead,
    moveToFolder,
    deleteEmail,
  };
}
