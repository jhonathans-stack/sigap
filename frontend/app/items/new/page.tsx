import { AuthGuard } from "@/components/auth/auth-guard";
import { NewItemPageContent } from "@/components/items/new-item-page-content";

export default function NewItemPage() {
  return (
    <AuthGuard allowedRoles={["admin", "super"]}>
      <NewItemPageContent />
    </AuthGuard>
  );
}
