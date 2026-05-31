import { AuthGuard } from "@/components/auth/auth-guard";
import { P2PChatPage } from "@/components/p2p/p2p-chat-page";

export default function P2PPage() {
  return (
    <AuthGuard allowedRoles={["user"]}>
      <P2PChatPage />
    </AuthGuard>
  );
}
