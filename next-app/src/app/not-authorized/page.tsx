import { ShieldAlert } from "lucide-react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-lg border-border/70 bg-white/85">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-destructive/10 p-3 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-2xl">Access denied</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your account does not have superadmin privileges.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Reach out to an existing superadmin for access.
          </p>
          <SignOutButton variant="outline" size="sm" />
        </CardContent>
      </Card>
    </main>
  );
}
