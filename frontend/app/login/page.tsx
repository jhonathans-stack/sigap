import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="SIGAP Sistema de Gestao de Achados e Perdidos"
      subtitle="Sistema de Gestao de Achados e Perdidos"
      footerLink={{
        href: "/register",
        text: "Ainda nao tem conta?",
        label: "Cadastrar"
      }}
    >
      <LoginForm />
    </AuthShell>
  );
}
