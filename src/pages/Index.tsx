import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Search, Database, Zap, Globe } from 'lucide-react';

const Index = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleCheckInbox = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      navigate(`/inbox/${encodeURIComponent(email.trim().toLowerCase())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Temporary Mail</CardTitle>
          <CardDescription className="text-base">Cek inbox email kamu dengan mudah</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Box */}
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent-foreground mb-3">
              <Database className="h-4 w-4" />
              <span>Optimized Service</span>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>File-based storage</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>Auto cleanup system</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <span>Memory-efficient processing</span>
              </li>
            </ul>
          </div>

          {/* Email Input Form */}
          <form onSubmit={handleCheckInbox} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Masukkan Alamat Email:
              </label>
              <Input
                id="email"
                type="email"
                placeholder="yourmail@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            
            <Button type="submit" className="w-full h-12 text-base gap-2">
              <Search className="h-4 w-4" />
              Cek Inbox
            </Button>
          </form>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Fast & Light</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>Multi Domain</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
