import { AuditPage } from "@/components/audit/audit-page";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AdminAuditPage() {
  return (
    <AuthGuard allowedRoles={["admin", "super"]}>
      <AuditPage />
    </AuthGuard>
  );
}
