import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="p-4 border-b border-border">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search emails..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button className="absolute right-2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
