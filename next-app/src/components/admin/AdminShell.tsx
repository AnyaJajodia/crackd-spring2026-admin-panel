"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  FileText,
  Image,
  ListChecks,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Waypoints,
} from "lucide-react";
import { motion } from "framer-motion";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  email?: string | null;
  children: React.ReactNode;
};

const navGroups = [
  {
    label: "Content",
    items: [
      { href: "/admin/captions", label: "Captions", icon: FileText },
      { href: "/admin/images", label: "Images", icon: Image },
      { href: "/admin/profiles", label: "Profiles", icon: Users },
      { href: "/admin/caption-examples", label: "Caption Examples", icon: Sparkles },
      { href: "/admin/terms", label: "Terms", icon: ListChecks },
    ],
  },
  {
    label: "Stats",
    items: [
      { href: "/admin/captions-stats", label: "Caption Stats", icon: BarChart3 },
      { href: "/admin/alignment", label: "Alignment Stats", icon: Image },
      { href: "/admin/caption-popularity", label: "Caption Popularity", icon: BarChart3 },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { href: "/admin/caption-requests", label: "Caption Requests", icon: FileText },
      { href: "/admin/humor-flavors", label: "Humor Flavors", icon: Sparkles },
      { href: "/admin/humor-flavor-steps", label: "Humor Flavor Steps", icon: Waypoints },
      { href: "/admin/humor-mix", label: "Humor Mix", icon: Sparkles },
      { href: "/admin/llm-prompt-chains", label: "LLM Prompt Chains", icon: Waypoints },
      { href: "/admin/llm-responses", label: "LLM Responses", icon: Bot },
      { href: "/admin/llm-models", label: "LLM Models", icon: Bot },
      { href: "/admin/llm-providers", label: "LLM Providers", icon: Bot },
    ],
  },
  {
    label: "Access / Config",
    items: [
      { href: "/admin/allowed-signup-domains", label: "Allowed Signup Domains", icon: ShieldCheck },
      { href: "/admin/whitelisted-emails", label: "Whitelisted Emails", icon: Mail },
    ],
  },
];

export function AdminShell({ email, children }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex min-h-screen">
      <motion.aside
        animate={{ width: collapsed ? 88 : 280 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-border/60 bg-white/70 p-3 backdrop-blur-lg"
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
            <nav className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href}
                              className={cn(
                                "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-[13px] font-medium transition",
                                isActive
                                  ? "border-border/70 bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:border-border/70 hover:bg-white"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="whitespace-nowrap">{item.label}</span>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </nav>
          </TooltipProvider>
        )}

        <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3">
          {!collapsed && (
            <>
              <div className="rounded-2xl border border-border/70 bg-white/80 p-2.5 text-xs shadow-sm">
                <p className="uppercase tracking-[0.2em] text-muted-foreground">Signed in</p>
                <p className="mt-1.5 truncate text-sm font-medium text-foreground" title={email ?? "Unknown"}>
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
