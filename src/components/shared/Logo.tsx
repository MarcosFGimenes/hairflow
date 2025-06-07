import Link from 'next/link';
import { Scissors } from 'lucide-react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showIcon?: boolean;
}

export function Logo({ size = 'medium', color, showIcon = true }: LogoProps) {
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-3xl',
    large: 'text-5xl',
  };

  return (
    <Link href="/" className="flex items-center gap-2 group">
      {showIcon && <Scissors className={`text-primary group-hover:text-accent transition-colors ${size === 'small' ? 'h-5 w-5' : size === 'medium' ? 'h-7 w-7' : 'h-9 w-9'}`} />}
      <h1 className={`font-headline font-bold ${sizeClasses[size]}`} style={{ color: color }}>
        Hairflow
      </h1>
    </Link>
  );
}