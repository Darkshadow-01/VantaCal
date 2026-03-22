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
        "flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800",
        "transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-gray-100 dark:border-gray-800",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VanCal
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
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
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
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
      <div className="px-2 py-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg",
            "text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
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
        "p-4 border-t border-gray-100 dark:border-gray-800",
        collapsed && "flex justify-center"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">AS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                Ashutosh
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                ashutosh@example.com
              </p>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">AS</span>
          </div>
        )}
      </div>
    </aside>
  );
}
