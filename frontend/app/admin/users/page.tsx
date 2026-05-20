import { AuthGuard } from "@/components/auth/auth-guard";
import { UserManagementPage } from "@/components/users/user-management-page";

export default function UsersPage() {
  return (
    <AuthGuard allowedRoles={["admin", "super"]}>
      <UserManagementPage />
    </AuthGuard>
  );
}
