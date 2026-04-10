import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BarChart3, ExternalLink, TrendingUp, Users, Eye, MousePointer } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  // Auth temporarily disabled

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
            Analytics
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Website traffic and conversion tracking
          </p>
        </div>
        {gaId && (
          <a
            href={`https://analytics.google.com/analytics/web/#/p${gaId}/reports`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-bg-secondary border border-border hover:border-accent text-white px-4 py-2.5 rounded-sm font-bold text-xs uppercase tracking-wide transition-colors"
          >
            Open Google Analytics <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {!gaId ? (
        <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center">
          <BarChart3 className="w-10 h-10 text-accent mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg uppercase tracking-tight mb-2">
            Connect Google Analytics
          </h3>
          <p className="text-text-secondary text-sm max-w-lg mx-auto mb-4">
            Add your <code className="text-accent">NEXT_PUBLIC_GA_ID</code> environment
            variable (e.g., <code className="text-accent">G-XXXXXXXXXX</code>) to enable
            full analytics tracking across the site.
          </p>
          <p className="text-text-secondary text-xs">
            Once connected, every page view, button click, and form submission will be
            tracked automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Tracked Events Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard title="Tracking ID" value={gaId} icon={BarChart3} />
            <KPICard title="Page Views" value="Live in GA" icon={Eye} />
            <KPICard title="Visitors" value="Live in GA" icon={Users} />
            <KPICard title="Conversions" value="Live in GA" icon={MousePointer} />
          </div>

          <div className="space-y-6">
            {/* Events Being Tracked */}
            <div className="bg-bg-secondary border border-border rounded-sm p-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                Events Being Tracked
              </h3>
              <div className="space-y-3">
                {[
                  { event: "page_view", desc: "Every page navigation across the site", auto: true },
                  { event: "register_click", desc: "Register Now button clicks (header, hero, events)", auto: true },
                  { event: "contact_submit", desc: "Contact form submissions", auto: true },
                  { event: "chat_open", desc: "AI assistant chat widget opened", auto: true },
                  { event: "chat_message", desc: "Messages sent to the AI assistant", auto: true },
                  { event: "facility_rental_click", desc: "Book the Facility / Request a Quote clicks", auto: true },
                  { event: "instagram_click", desc: "Instagram profile link clicks", auto: true },
                  { event: "phone_click", desc: "Phone number taps (mobile)", auto: true },
                  { event: "email_click", desc: "Email link clicks", auto: true },
                  { event: "schedule_view", desc: "Schedule page visits during active events", auto: true },
                ].map((item) => (
                  <div
                    key={item.event}
                    className="flex items-center justify-between bg-bg border border-border rounded-sm px-4 py-3"
                  >
                    <div>
                      <code className="text-accent text-sm font-bold">{item.event}</code>
                      <p className="text-text-secondary text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <span className="text-success text-xs font-bold uppercase">Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Funnels */}
            <div className="bg-bg-secondary border border-border rounded-sm p-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                Key Conversion Funnels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg border border-border rounded-sm p-4">
                  <h4 className="text-white font-bold text-sm mb-2">Tournament Registration</h4>
                  <div className="space-y-1 text-text-secondary text-xs">
                    <p>1. Homepage visit → <span className="text-accent">page_view</span></p>
                    <p>2. Events page → <span className="text-accent">page_view /events</span></p>
                    <p>3. Register click → <span className="text-accent">register_click</span></p>
                    <p>4. Contact submit → <span className="text-accent">contact_submit</span></p>
                  </div>
                </div>
                <div className="bg-bg border border-border rounded-sm p-4">
                  <h4 className="text-white font-bold text-sm mb-2">Facility Rental</h4>
                  <div className="space-y-1 text-text-secondary text-xs">
                    <p>1. Homepage visit → <span className="text-accent">page_view</span></p>
                    <p>2. Facility page → <span className="text-accent">page_view /facility</span></p>
                    <p>3. Request quote → <span className="text-accent">facility_rental_click</span></p>
                    <p>4. Contact submit → <span className="text-accent">contact_submit</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
