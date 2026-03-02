import { AdminShell } from "@/components/admin/AdminShell";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSuperadmin();

  return <AdminShell email={profile.email}>{children}</AdminShell>;
}
