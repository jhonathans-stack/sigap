import Link from "next/link";
import { ClipboardList, RotateCcw, SearchCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const featureItems = [
  { icon: ClipboardList, label: "Cadastro de itens" },
  { icon: RotateCcw, label: "Controle de devolução" },
  { icon: SearchCheck, label: "Consulta rápida" }
];

export function AuthShell({
  children,
  subtitle,
  footerLink
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerLink: { href: string; label: string; text: string };
}) {
  const isLogin = footerLink.href === "/register";
  const heading = isLogin ? "Entrar no SIGAP" : "Criar conta";

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#eaf1fb_0%,#f1f5f9_52%,#e7f7ef_100%)] px-4 py-5 text-slate-950 dark:bg-[linear-gradient(135deg,#0f172a_0%,#020617_100%)] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-lg border border-slate-300/70 bg-slate-100/80 shadow-[0_20px_70px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_18px_60px_rgba(0,0,0,0.55)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative flex min-h-[27rem] flex-col justify-center overflow-hidden bg-[linear-gradient(135deg,#2563eb_0%,#047857_100%)] p-5 text-white dark:bg-[linear-gradient(135deg,#1e3a8a_0%,#065f46_100%)] sm:min-h-[32rem] sm:p-9 lg:min-h-full lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:38px_38px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-emerald-300" />

          <div className="relative">
            <div className="mb-9 flex justify-end sm:mb-14">
              <ThemeToggle />
            </div>

            <div className="max-w-xl">
              <h1 className="text-5xl font-black leading-none tracking-tight text-white sm:text-7xl lg:text-8xl">
                SIGAP
              </h1>
              <p className="mt-6 text-lg font-semibold leading-7 text-cyan-50/90 sm:mt-8 sm:text-2xl sm:leading-8">
                {subtitle}
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-100/80 sm:mt-5">
                Gerencie itens encontrados de forma simples e organizada
              </p>
            </div>

            <div className="mt-7 grid gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-3">
              {featureItems.map((item) => (
                <div
                  key={item.label}
                  className="sigap-feature-card flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 p-3 shadow-sm backdrop-blur hover:-translate-y-[3px] sm:block sm:p-4"
                >
                  <item.icon size={20} className="shrink-0 text-emerald-200" />
                  <span className="block text-sm font-semibold leading-5 text-white sm:mt-3">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-1 flex-col justify-center bg-slate-100/80 p-5 dark:bg-[#020617] sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
                {isLogin ? "Acesso ao sistema" : "Novo acesso"}
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{heading}</h2>
            </div>

            <div className="sigap-auth-card rounded-lg border border-slate-300/80 bg-slate-50/90 p-5 shadow-[0_14px_45px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-[#0b1220] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:p-6">
              {children}
            </div>

            {!isLogin ? (
              <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
                {footerLink.text}{" "}
                <Link href={footerLink.href} className="font-semibold text-blue-700 hover:underline dark:text-blue-400">
                  {footerLink.label}
                </Link>
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <footer className="py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-500">SIGAP 2026</footer>
    </main>
  );
}
