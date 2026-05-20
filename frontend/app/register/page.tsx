import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="SIGAP Sistema de Gestao de Achados e Perdidos"
      subtitle="Sistema de Gestao de Achados e Perdidos"
      footerLink={{
        href: "/login",
        text: "Ja possui conta?",
        label: "Entrar"
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
}
