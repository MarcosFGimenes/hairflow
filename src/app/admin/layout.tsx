
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react'; // For loading spinner

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading Admin Panel...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback, prevent rendering children if no user.
    // You might want to show a message or redirect again here.
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
          <main className="flex-1 p-6 bg-background">
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
