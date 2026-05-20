import { AuthGuard } from "@/components/auth/auth-guard";
import { MyRequestsPage } from "@/components/lost/my-requests-page";

export default function RequestsPage() {
  return (
    <AuthGuard>
      <MyRequestsPage />
    </AuthGuard>
  );
}
