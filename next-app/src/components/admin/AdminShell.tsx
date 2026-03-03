"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChevronLeft, FileText, Image, Menu, User, Users } from "lucide-react";
import { motion } from "framer-motion";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  email?: string | null;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin/captions", label: "Captions", icon: FileText },
  { href: "/admin/captions-stats", label: "Caption Stats", icon: BarChart3 },
  { href: "/admin/images", label: "Images", icon: Image },
  { href: "/admin/profiles", label: "Profiles", icon: Users },
  { href: "/admin/alignment", label: "Alignment Stats", icon: Image },
];

export function AdminShell({ email, children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex min-h-screen">
      <motion.aside
        animate={{ width: collapsed ? 88 : 280 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="sticky top-0 h-screen shrink-0 border-r border-border/60 bg-white/70 p-4 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between gap-3">
          {!collapsed && (
            <div className="overflow-hidden text-lg font-semibold tracking-tight">
              <span className="font-display">Crackd Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((prev) => !prev)}
            className="rounded-full"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <TooltipProvider>
            <nav className="mt-8 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-medium transition",
                          isActive
                            ? "border-border/70 bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:border-border/70 hover:bg-white"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-6">
          {!collapsed && (
            <>
              <div className="rounded-2xl border border-border/70 bg-white/80 p-3 text-xs shadow-sm">
                <p className="uppercase tracking-[0.2em] text-muted-foreground">Signed in</p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {email ?? "Unknown"}
                </p>
              </div>
              <SignOutButton
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-xl px-2 text-muted-foreground hover:text-foreground"
              />
            </>
          )}
          {collapsed && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-white/80">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      <main className="flex-1 px-6 py-10 lg:px-10">{children}</main>
    </div>
  );
}
