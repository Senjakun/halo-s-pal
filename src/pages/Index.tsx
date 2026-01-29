import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Search, Database, Zap, Globe, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(250,80%,65%)] via-[hsl(230,75%,60%)] to-[hsl(200,80%,55%)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">📧 Temporary Mail</CardTitle>
          <CardDescription className="text-base">Cek inbox email kamu dengan mudah</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Box */}
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent-foreground mb-3">
              <Database className="h-4 w-4 text-accent" />
              <span className="text-accent">💾 Optimized Service</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />
                <span>File-based storage</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />
                <span>Auto cleanup system (7 days)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />
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
            
            <Button type="submit" className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90">
              <Search className="h-4 w-4" />
              🔍 Cek Inbox
            </Button>
          </form>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Fast & Light</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 text-primary" />
              <span>Multi Domain</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              💾 Optimized for low memory usage (1GB RAM)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              📁 File-based storage enabled for persistent data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
