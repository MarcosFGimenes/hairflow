
"use client"; // Make this a client component to use hooks

import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserCircle, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useToast } from "@/hooks/use-toast";

export function GlobalHeader() {
  const { user, loading, logout } = useAuth(); // Get user, loading, and logout from useAuth
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      // AuthProvider's logout already handles redirect and toast
    } catch (error: any) {
      console.error("Logout error from global header:", error);
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/appointments" legacyBehavior={false}>
            <Button variant="ghost">Agende agora!</Button>
          </Link>

          {loading ? (
            <Button variant="ghost" size="icon" disabled>
              <UserCircle className="h-5 w-5 animate-pulse" />
            </Button>
          ) : user ? (
            <>
              <Link href="/admin" legacyBehavior={false}>
                <Button variant="outline">
                  <LayoutDashboard className="mr-0 sm:mr-2 h-4 w-4" /> 
                  <span className="hidden sm:inline">Painel admin</span>
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleLogout} title="Logout">
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              {/* Optional: Profile link if you have a user profile page
              <Link href="/profile" legacyBehavior={false}>
                <Button variant="ghost" size="icon" title={user.email || "Profile"}>
                  <UserCircle className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
              </Link>
              */}
            </>
          ) : (
            <Link href="/auth/login" legacyBehavior={false}>
              <Button variant="default">
                <LogIn className="mr-2 h-4 w-4" /> Painel Admin
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
