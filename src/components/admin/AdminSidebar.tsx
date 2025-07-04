// src/components/admin/AdminSidebar.tsx

"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// ÍCONES ATUALIZADOS: Adicionado 'Contact' para o CRM de Clientes
import { LayoutDashboard, CalendarDays, Clock, Users, Settings, LogOut, Bell, LayoutGrid, Contact } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

// ITENS DE NAVEGAÇÃO ATUALIZADOS: Adicionado link para Clientes (CRM)
const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { href: '/admin/customers', label: 'Clientes', icon: Contact }, // <-- NOVO: Link para o CRM
  { href: '/admin/professionals', label: 'Profissionais', icon: Users },
  { href: '/admin/services', label: 'Serviços', icon: LayoutGrid },
  { href: '/admin/slots', label: 'Gerenciar Horários', icon: Clock },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      console.error("Logout error from sidebar:", error);
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Logo size="small" showIcon={false} />
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-sidebar-accent-foreground">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </SidebarHeader>
      
      <Separator className="bg-sidebar-border" />

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior={false}>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <Separator className="bg-sidebar-border" />
      
      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt={user?.displayName || "Admin"} data-ai-hint="person avatar"/>
            <AvatarFallback>{user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground truncate" title={user?.email || "Admin User"}>
              {user?.email || "Admin User"}
            </p>
            <p className="text-xs text-sidebar-foreground/70">Dono(a) do Salão</p>
          </div>
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="h-5 w-5 group-data-[collapsible=icon]:mr-0 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}