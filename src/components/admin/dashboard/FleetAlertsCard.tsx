"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Truck, ArrowUpRight, Shield } from "lucide-react";

type Vehicle = {
  id: number;
  name: string;
  licensePlate: string | null;
  alerts: string[];
  openDamageCount: number;
};
type FleetPayload = {
  vehicles: Vehicle[];
  totals: { alertCount: number; openDamage: number };
};

const ALERT_LABELS: Record<string, { label: string; tone: string }> = {
  insurance_expired: { label: "Insurance expired", tone: "text-red" },
  insurance_expiring: { label: "Insurance expiring", tone: "text-amber-600" },
  registration_expired: { label: "Registration expired", tone: "text-red" },
  registration_expiring: { label: "Registration expiring", tone: "text-amber-600" },
  service_due: { label: "Service due", tone: "text-amber-600" },
  inspection_overdue: { label: "Inspection overdue", tone: "text-red" },
  inspection_soon: { label: "Inspection soon", tone: "text-amber-600" },
};

export default function FleetAlertsCard() {
  const [data, setData] = useState<FleetPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/fleet")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const flagged = data.vehicles.filter((v) => v.alerts.length > 0 || v.openDamageCount > 0);
  if (flagged.length === 0) return null;

  return (
    <section aria-label="Fleet alerts" className="mb-8">
      <div className="bg-white border border-red/20 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-red/10 bg-red/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Fleet Alerts</h2>
            <span className="bg-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {data.totals.alertCount + data.totals.openDamage}
            </span>
          </div>
          <Link href="/admin/resources?filter=alerts" className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1">
            Open Fleet <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {flagged.slice(0, 6).map((v) => (
            <li key={v.id}>
              <Link href={`/admin/resources/${v.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-off-white transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-off-white flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-navy/60" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm truncate">
                    {v.name} {v.licensePlate ? `· ${v.licensePlate}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {v.alerts.slice(0, 3).map((a) => {
                      const info = ALERT_LABELS[a] || { label: a, tone: "text-text-muted" };
                      return (
                        <span key={a} className={`text-[10px] font-semibold ${info.tone}`}>
                          {info.label}
                        </span>
                      );
                    })}
                    {v.openDamageCount > 0 && (
                      <span className="text-[10px] font-semibold text-red flex items-center gap-1">
                        <Shield className="w-3 h-3" aria-hidden="true" />
                        {v.openDamageCount} damage
                      </span>
                    )}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
