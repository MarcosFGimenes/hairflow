import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserCircle, LogIn } from 'lucide-react';

export function GlobalHeader() {
  // Placeholder for authentication status
  const isAuthenticated = false;
  const isAdmin = false;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-4">
          <Link href="/appointments">
            <Button variant="ghost">Book Now</Button>
          </Link>

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="default">
                <LogIn className="mr-2 h-4 w-4" /> Salon Login
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}