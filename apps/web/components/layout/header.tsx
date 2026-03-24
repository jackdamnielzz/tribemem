'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Settings, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';

interface AlertItem {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

const severityColor: Record<string, string> = {
  critical: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500',
  info: 'text-muted-foreground',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'zojuist';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m geleden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  return `${days}d geleden`;
}

interface HeaderProps {
  orgName?: string;
}

export function Header({ orgName = 'My Organization' }: HeaderProps) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const unreadCount = alerts.filter((a) => !a.is_read && !a.is_resolved).length;

  const markAsRead = async (id: string) => {
    await fetch(`/api/v1/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">{orgName}</h2>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu onOpenChange={(open) => open && fetchAlerts()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel>Meldingen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading && alerts.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">Laden...</div>
            ) : alerts.filter((a) => !a.is_resolved).length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Geen meldingen
              </div>
            ) : (
              alerts
                .filter((a) => !a.is_resolved)
                .slice(0, 8)
                .map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex flex-col items-start gap-1 cursor-pointer"
                    onClick={() => {
                      if (!alert.is_read) markAsRead(alert.id);
                      router.push('/alerts');
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`text-sm font-medium ${!alert.is_read ? '' : 'text-muted-foreground'}`}>
                        {alert.title}
                      </span>
                      <span className={`text-xs ${severityColor[alert.severity] ?? ''}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {alert.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(alert.created_at)}
                    </span>
                  </DropdownMenuItem>
                ))
            )}
            {alerts.filter((a) => !a.is_resolved).length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center text-sm text-primary cursor-pointer"
                  onClick={() => router.push('/alerts')}
                >
                  Alle meldingen bekijken
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs leading-none text-muted-foreground">john@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
