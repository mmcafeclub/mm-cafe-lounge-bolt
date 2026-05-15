import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ExpandableText({ children, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  if (!children) return null;

  const isLong = String(children).length > 95;

  return (
    <div>
      <p className={`${className} ${expanded ? '' : 'line-clamp-3'}`}>{children}</p>
      {isLong && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 mt-1 text-xs text-primary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'See less' : 'See more'}
        </Button>
      )}
    </div>
  );
}