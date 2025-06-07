import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { GlobalHeader } from '@/components/shared/GlobalHeader'; // Using GlobalHeader for consistency

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Admin specific header could go here, or a simplified one */}
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 p-4 backdrop-blur md:hidden">
            {/* Mobile header content, e.g., burger for sidebar, logo */}
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
