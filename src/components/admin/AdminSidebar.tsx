"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, CalendarDays, Clock, Users, Settings, LogOut, Bell, Scissors } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/admin/slots', label: 'Manage Slots', icon: Clock },
  { href: '/admin/professionals', label: 'Professionals', icon: Users },
  { href: '/admin/settings', label: 'Salon Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Logo size="small" showIcon={false} />
        {/* Placeholder for notification icon */}
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
              <Link href={item.href} passHref legacyBehavior>
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
              <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="person avatar" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
              <p className="text-xs text-sidebar-foreground/70">Salon Owner</p>
            </div>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
             <ThemeToggle />
          </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center">
          <LogOut className="h-5 w-5 group-data-[collapsible=icon]:mr-0 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
