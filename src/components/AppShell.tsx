import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Boxes, Home, MoreHorizontal, ScanLine, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", icon: Home, key: "home" as const },
  { to: "/stock", icon: Boxes, key: "stock" as const },
  { to: "/scan", icon: ScanLine, key: "scan" as const, center: true },
  { to: "/orders", icon: ShoppingBag, key: "orders" as const },
  { to: "/more", icon: MoreHorizontal, key: "more" as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <ul className="mx-auto flex max-w-md items-end justify-between px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {tabs.map(({ to, icon: Icon, key, center }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {center ? (
                    <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-float">
                      <Icon className="h-6 w-6" />
                    </span>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="bg-brand px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-primary-foreground">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm opacity-85">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
