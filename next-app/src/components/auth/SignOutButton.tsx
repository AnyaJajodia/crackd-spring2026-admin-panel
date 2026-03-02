"use client";

import * as React from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
  variant?: "ghost" | "default" | "secondary" | "outline" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
};

export function SignOutButton({
  className,
  variant = "ghost",
  size = "sm",
  label = "Sign out",
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOut className="h-4 w-4" />
      {label}
    </Button>
  );
}
