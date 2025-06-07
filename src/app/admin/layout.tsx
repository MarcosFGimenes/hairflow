
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
// GlobalHeader is not typically part of admin layout, but can be added if needed
// import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react'; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, firebaseAuthAvailable } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If Firebase isn't available and we're not loading, it's a critical setup error.
    // Redirect to login, but this indicates a bigger problem.
    if (!loading && !firebaseAuthAvailable) {
      console.error("AdminLayout: Firebase Auth is not available. Redirecting to login. Check Firebase setup.");
      router.push('/auth/login');
      return;
    }

    if (!loading && firebaseAuthAvailable && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, firebaseAuthAvailable, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading Admin Panel...</p>
      </div>
    );
  }

  if (!firebaseAuthAvailable) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Firebase Authentication Error</h1>
        <p className="text-lg text-foreground mb-2">Could not initialize Firebase Authentication.</p>
        <p className="text-muted-foreground">Please ensure your Firebase configuration (API keys in .env.local) is correct and the server has been restarted.</p>
        <p className="text-muted-foreground mt-1">The admin panel cannot load without Firebase.</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback or if firebaseAuthAvailable is true but user is still null (e.g. mid-redirect)
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <p className="text-lg text-foreground">Redirecting to login...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 p-4 backdrop-blur md:hidden">
            <span className="font-headline text-lg">Hairflow Admin</span>
          </header>
          <main className="flex-1 p-6 bg-secondary"> {/* Changed bg-background to bg-secondary for content area contrast */}
            {children}
          </main>
           <footer className="p-4 border-t text-center text-sm text-muted-foreground">
            Hairflow Admin Panel &copy; {new Date().getFullYear()}
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
