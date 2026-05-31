import { AuthGuard } from "@/components/auth/auth-guard";
import { P2PReportPage } from "@/components/p2p/p2p-report-page";

export default function AdminP2PReportPage() {
  return (
    <AuthGuard allowedRoles={["super"]}>
      <P2PReportPage />
    </AuthGuard>
  );
}
