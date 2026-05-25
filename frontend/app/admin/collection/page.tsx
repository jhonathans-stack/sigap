import { AuthGuard } from "@/components/auth/auth-guard";
import { CollectionPage } from "@/components/admin/collection-page";

export default function AdminCollectionPage() {
  return (
    <AuthGuard allowedRoles={["admin", "super"]}>
      <CollectionPage />
    </AuthGuard>
  );
}
