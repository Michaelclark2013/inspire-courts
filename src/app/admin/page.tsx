import {
  Users,
  Trophy,
  DollarSign,
  UserCheck,
  Handshake,
  Flame,
  Mail,
  MessageSquare,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import NotionFallback from "@/components/dashboard/NotionFallback";
import {
  getAllTeams,
  getAllTournaments,
  getMoneyLog,
  getAllStaff,
  getAllReferees,
  getAllSponsors,
  getChatLeads,
  getProperty,
  isNotionConfigured,
} from "@/lib/notion";

export default async function AdminOverview() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Inspire Courts AZ Operations Overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {["Teams in Pipeline", "Hot Leads", "Upcoming Events", "Last Event Revenue", "Active Sponsors", "Staff on Roster"].map((title) => (
            <KPICard key={title} title={title} value="—" icon={Users} />
          ))}
        </div>
        <NotionFallback type="no-key" entityName="dashboard" />
      </div>
    );
  }

  const [teams, tournaments, moneyLog, staff, referees, sponsors, leads] = await Promise.all([
    getAllTeams(),
    getAllTournaments(),
    getMoneyLog(),
    getAllStaff(),
    getAllReferees(),
    getAllSponsors(),
    getChatLeads(),
  ]);

  // Compute KPIs
  const upcomingEvents = tournaments.filter((t: any) => {
    const status = getProperty(t, "Status");
    return status === "Registration Open" || status === "Planning" || status === "In Progress";
  });

  const hotLeads = leads.filter((l: any) => {
    const urgency = getProperty(l, "Urgency");
    const status = getProperty(l, "Status");
    return urgency === "Hot" || status === "New";
  });

  const activeSponsors = sponsors.filter((s: any) => {
    const status = getProperty(s, "Status");
    return status === "Active";
  });

  // Revenue from money log
  let totalRevenue = 0;
  for (const entry of moneyLog) {
    const amount = getProperty(entry, "Amount") || 0;
    const direction = getProperty(entry, "Direction") || getProperty(entry, "Type");
    if (direction === "In" || direction === "Money In" || direction === "Revenue") {
      totalRevenue += Number(amount) || 0;
    }
  }

  const kpis = [
    { title: "Teams in Pipeline", value: teams.length.toString(), icon: Users },
    { title: "Hot Leads", value: hotLeads.length.toString(), icon: Flame },
    { title: "Upcoming Events", value: upcomingEvents.length.toString(), icon: Trophy },
    { title: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { title: "Active Sponsors", value: activeSponsors.length.toString(), icon: Handshake },
    { title: "Staff on Roster", value: (staff.length + referees.length).toString(), icon: UserCheck },
  ];

  // Recent leads (last 5)
  const recentLeads = leads.slice(0, 5).map((l: any) => ({
    name: getProperty(l, "Name") || "Unknown",
    email: getProperty(l, "Email") || "—",
    interest: getProperty(l, "Interest") || "General",
    urgency: getProperty(l, "Urgency") || "—",
    source: getProperty(l, "Source") || "—",
    date: getProperty(l, "Created") || l.created_time || "—",
  }));

  const urgencyColors: Record<string, string> = {
    Hot: "bg-red-500/10 text-red-400 border border-red-500/20",
    Warm: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    Cold: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Inspire Courts AZ Operations Overview</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Recent Leads */}
      <div className="bg-bg-secondary border border-border rounded-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h2 className="text-white font-bold text-sm uppercase tracking-tight">Recent Leads</h2>
          </div>
          <a href="/admin/contacts" className="text-accent text-xs hover:underline">
            View all →
          </a>
        </div>
        {recentLeads.length === 0 ? (
          <div className="p-6 text-center text-text-secondary text-sm">
            No leads captured yet. They will appear here from the chatbot and contact form.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentLeads.map((lead: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {lead.source === "Contact Form" ? (
                    <Mail className="w-3.5 h-3.5 text-accent" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{lead.name}</p>
                  <p className="text-text-secondary text-xs truncate">{lead.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent flex-shrink-0">
                  {lead.interest}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${urgencyColors[lead.urgency] || "bg-bg text-text-secondary"}`}>
                  {lead.urgency}
                </span>
                <span className="text-text-secondary text-xs flex-shrink-0 hidden sm:block">
                  {lead.date !== "—" ? new Date(lead.date).toLocaleDateString() : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
