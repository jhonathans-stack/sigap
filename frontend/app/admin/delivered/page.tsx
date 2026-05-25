import { AuthGuard } from "@/components/auth/auth-guard";
import { DeliveredPage } from "@/components/admin/delivered-page";

export default function AdminDeliveredPage() {
  return (
    <AuthGuard allowedRoles={["admin", "super"]}>
      <DeliveredPage />
    </AuthGuard>
  );
}
