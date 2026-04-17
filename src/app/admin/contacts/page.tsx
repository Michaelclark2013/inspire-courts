import NotionFallback from "@/components/dashboard/NotionFallback";
import LeadsClient from "@/components/admin/LeadsClient";
import { getChatLeads, getProperty, isNotionConfigured } from "@/lib/notion";

export default async function ContactsPage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">Contacts</h1>
          <p className="text-text-secondary text-sm mt-1">Chat & Contact Form Submissions</p>
        </div>
        <NotionFallback type="no-key" entityName="contacts" />
      </div>
    );
  }

  const data = await getChatLeads();

  const leads = data.map((l: Record<string, unknown> & { created_time?: string }) => {
    const date = getProperty(l, "Created") || l.created_time || "";
    return {
      name: getProperty(l, "Name") || "Unknown",
      email: getProperty(l, "Email") || "—",
      phone: getProperty(l, "Phone") || "—",
      interest: getProperty(l, "Interest") || "General",
      urgency: getProperty(l, "Urgency") || "—",
      status: getProperty(l, "Status") || "New",
      summary: getProperty(l, "Summary") || "—",
      source: getProperty(l, "Source") || "—",
      transcript: getProperty(l, "Chat Transcript") || "—",
      date: date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    };
  });

  if (leads.length === 0) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">Contacts</h1>
          <p className="text-text-secondary text-sm mt-1">Chat & Contact Form Submissions</p>
        </div>
        <NotionFallback type="empty" entityName="contacts" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">Contacts</h1>
        <p className="text-text-secondary text-sm mt-1">Chat & Contact Form Submissions — captured automatically from chatbot and contact form</p>
      </div>
      <LeadsClient leads={leads} />
    </div>
  );
}
