import { CheckCircle, FileText, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const featureItems = [
  {
    icon: FileText,
    title: "Cadastro de itens",
    description: "Registre objetos encontrados com fotos e descrições detalhadas"
  },
  {
    icon: CheckCircle,
    title: "Controle de devolução",
    description: "Acompanhe solicitações e confirmações de entrega"
  },
  {
    icon: Search,
    title: "Consulta rápida",
    description: "Busque e filtre itens por categoria, local e status"
  }
];

export function AuthShell({
  children,
  footerLink
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerLink: { href: string; label: string; text: string };
}) {
  const isLogin = footerLink.href === "/register";

  if (!isLogin) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="fixed right-5 top-5 z-20">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">Criar conta no SIGAP</h1>
            <p className="text-gray-600 dark:text-gray-400">Preencha seus dados para acessar o sistema</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            {children}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen">
      <div className="fixed right-5 top-5 z-20">
        <ThemeToggle />
      </div>
      <section className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 p-12 lg:flex">
        <div className="max-w-xl">
          <h1 className="mb-4 text-6xl font-bold text-white">SIGAP</h1>
          <p className="mb-2 text-2xl text-blue-100">Sistema de Gestão de Achados e Perdidos</p>
          <p className="mb-12 text-lg text-blue-200">Gerencie itens encontrados de forma simples e organizada</p>

          <div className="space-y-4">
            {featureItems.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <item.icon className="mt-1 h-6 w-6 flex-shrink-0 text-blue-200" />
                <div>
                  <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-blue-200">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex w-full items-center justify-center bg-gray-50 p-8 dark:bg-gray-900 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-8">
              <div className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">Acesso seguro</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Entrar no SIGAP</h2>
            </div>

            {children}
          </div>

          <div className="mt-8 text-center lg:hidden">
            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">SIGAP</h3>
            <p className="text-gray-600 dark:text-gray-400">Sistema de Gestão de Achados e Perdidos</p>
          </div>
        </div>
      </section>
    </main>
  );
}
