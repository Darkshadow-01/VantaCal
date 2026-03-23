"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  LayoutDashboard, 
  Compass, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/", icon: Calendar },
  { name: "Life Compass", href: "/life-compass", icon: Compass },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-background dark:bg-[#2B262C] border-r border-border dark:border-gray-800",
        "transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-border dark:border-gray-800",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground dark:text-[#F5F1E8]">
              VanCal
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                "text-sm font-medium",
                isActive
                  ? "bg-muted text-foreground dark:bg-gray-800 dark:text-[#F5F1E8]"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-[#F5F1E8]",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-blue-600")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 py-4 border-t border-border dark:border-gray-800">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
            "text-sm font-medium text-muted-foreground hover:bg-muted/50 dark:text-gray-400 dark:hover:bg-gray-800",
            "transition-all duration-150",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User */}
      <div className={cn(
        "p-4 border-t border-border dark:border-gray-800",
        collapsed && "flex justify-center"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium text-foreground dark:text-[#F5F1E8]">AS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground dark:text-[#F5F1E8] truncate">
                Ashutosh
              </p>
              <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                ashutosh@example.com
              </p>
            </div>
            <button className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-[#F5F1E8] transition-colors rounded-lg hover:bg-muted dark:hover:bg-gray-800">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-foreground dark:text-[#F5F1E8]">AS</span>
          </div>
        )}
      </div>
    </aside>
  );
}
