import React, { ReactNode, useCallback, useRef, useState } from 'react';

type CopyableProps = {
  copyText: string;
  name: string;
  className?: string;
  children?: ReactNode | ((copied: boolean) => ReactNode);
};

export const Copyable: React.FC<CopyableProps> = ({ copyText, name, className, children }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [copyText]);

  const handleMouseEvent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div 
      className={className} 
      onClick={handleClick} 
      data-copied={copied}
      onMouseEnter={handleMouseEvent}
      onMouseLeave={handleMouseEvent}
    >
      {typeof children === 'function' ? children(copied) : children}
    </div>
  );
};
