import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Users,
  UsersRound,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Records', href: '/records', icon: Receipt },
  { label: 'Budgets', href: '/budgets', icon: Wallet, roles: ['MANAGER', 'ADMIN'] },
  { label: 'Teams', href: '/teams', icon: UsersRound, roles: ['ADMIN'] },
  { label: 'Users', href: '/users', icon: Users, roles: ['ADMIN'] },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const logout = useLogout();
  const userRole = user?.role ?? 'EMPLOYEE';

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <TooltipProvider delay={0}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn('flex h-16 items-center border-b border-border/50 px-4', collapsed && 'justify-center px-2')}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">Zorvyn</span>
                <span className="text-[10px] text-muted-foreground leading-none">Finance</span>
              </div>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 p-3">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const link = (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground',
                    collapsed && 'justify-center px-2'
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden md:flex justify-end p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        <Separator className="opacity-50" />

        {/* User section */}
        <div className={cn('p-3', collapsed && 'px-2')}>
          <div className={cn('flex items-center gap-3 rounded-lg p-2', collapsed && 'justify-center p-1')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user ? getInitials(user.name) : '?'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{company?.name}</p>
              </div>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                onClick={logout}
                className={cn(
                  'mt-1 w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                  collapsed && 'justify-center px-2'
                )}
                size="sm"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Sign out</span>}
              </Button>
            } />
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>
                Sign out
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentNav = navItems.find(
    (item) => item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href)
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[250px]'
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden">
          <SheetTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-3 top-3 z-50 h-10 w-10 shadow-sm bg-background/80 backdrop-blur-sm border border-border/50"
            >
              <Menu className="h-5 w-5" />
            </Button>
          } />
        </div>
        <SheetContent side="left" className="w-[250px] p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent
            collapsed={false}
            onToggle={() => {}}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border/50 px-6 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-10" /> {/* spacer for hamburger menu */}
            <h1 className="text-lg font-semibold tracking-tight">
              {currentNav?.label ?? 'Dashboard'}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
