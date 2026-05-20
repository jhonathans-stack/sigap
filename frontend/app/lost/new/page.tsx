import { AuthGuard } from "@/components/auth/auth-guard";
import { LostItemPageContent } from "@/components/lost/lost-item-page-content";

export default function LostItemPage() {
  return (
    <AuthGuard>
      <LostItemPageContent />
    </AuthGuard>
  );
}
