import { AuthGuard } from "@/components/auth/auth-guard";
import { HomePage } from "@/components/home/home-page";

export default function Page() {
  return (
    <AuthGuard>
      <HomePage />
    </AuthGuard>
  );
}
