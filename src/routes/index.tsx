import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  Camera,
  FileText,
  Receipt,
  ScanLine,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jan Pharma SmartStock — Pharmacy dashboard" },
      {
        name: "description",
        content: "Track medicine stock, expiry, purchase invoices and customer orders from your phone.",
      },
      { property: "og:title", content: "Jan Pharma SmartStock — Pharmacy dashboard" },
      {
        property: "og:description",
        content: "Track medicine stock, expiry, purchase invoices and customer orders from your phone.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const { t } = useI18n();

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [meds, orders] = await Promise.all([
        supabase.from("medicines").select("id, name, quantity, min_stock, expiry_date, purchase_price"),
        supabase.from("orders").select("id, status").eq("status", "pending"),
      ]);
      const list = meds.data ?? [];
      const soon = new Date();
      soon.setDate(soon.getDate() + 90);
      return {
        count: list.length,
        value: list.reduce((sum, m) => sum + Number(m.purchase_price) * m.quantity, 0),
        low: list.filter((m) => m.quantity <= m.min_stock),
        expiring: list.filter((m) => m.expiry_date && new Date(m.expiry_date) <= soon),
        pending: orders.data?.length ?? 0,
      };
    },
  });

  const stats = [
    { label: t("totalMedicines"), value: data?.count ?? 0, icon: Boxes },
    { label: t("stockValue"), value: `Rs ${Math.round(data?.value ?? 0).toLocaleString()}`, icon: Wallet },
    { label: t("lowStock"), value: data?.low.length ?? 0, icon: AlertTriangle },
    { label: t("expiringSoon"), value: data?.expiring.length ?? 0, icon: CalendarClock },
  ];

  const actions = [
    { to: "/scan", icon: ScanLine, label: t("scanBarcode") },
    { to: "/capture", icon: Camera, label: t("bulkPhotos") },
    { to: "/invoices", icon: Receipt, label: t("invoicePhoto") },
    { to: "/orders", icon: FileText, label: t("prescription") },
  ];

  return (
    <>
      <PageHeader title={t("appName")} subtitle={t("tagline")} />

      <main className="mx-auto -mt-4 max-w-md space-y-6 px-4">
        <section className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-card p-4 shadow-card">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-2 font-display text-xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold">{t("quickActions")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {actions.map(({ to, icon: Icon, label }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium shadow-card active:scale-[0.98]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">{t("pendingOrders")}</h2>
            <Link to="/orders" className="text-sm font-medium text-primary">
              {data?.pending ?? 0} <ShoppingBag className="inline h-4 w-4" />
            </Link>
          </div>
        </section>

        {!!data?.low.length && (
          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-destructive">{t("lowStock")}</h2>
            <ul className="space-y-2">
              {data.low.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-sm font-semibold text-destructive">{m.quantity}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!!data?.expiring.length && (
          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-accent-foreground">{t("expiringSoon")}</h2>
            <ul className="space-y-2">
              {data.expiring.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.expiry_date}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
