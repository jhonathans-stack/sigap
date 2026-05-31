import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="DropZone Sistema de Gestão de Achados e Perdidos"
      subtitle="Sistema de Gestão de Achados e Perdidos"
      footerLink={{
        href: "/register",
        text: "Ainda não tem conta?",
        label: "Cadastrar"
      }}
    >
      <LoginForm />
    </AuthShell>
  );
}
