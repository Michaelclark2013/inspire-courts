import NotionFallback from "@/components/dashboard/NotionFallback";
import StaffClient from "@/components/admin/StaffClient";
import { getAllStaff, getAllReferees, getProperty, isNotionConfigured } from "@/lib/notion";

export default async function StaffPage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Staff & Refs</h1>
          <p className="text-text-secondary text-sm mt-1">Event Staff & Referee Management from Notion</p>
        </div>
        <NotionFallback type="no-key" entityName="staff" />
      </div>
    );
  }

  const [staffData, refsData] = await Promise.all([getAllStaff(), getAllReferees()]);

  const staff = staffData.map((s: any) => ({
    name: getProperty(s, "Name") || "—",
    role: getProperty(s, "Role") || getProperty(s, "Position") || "—",
    shifts: Number(getProperty(s, "Shifts")) || 0,
    hoursWorked: Number(getProperty(s, "Hours") || getProperty(s, "Hours Worked")) || 0,
    totalPay: (() => {
      const pay = getProperty(s, "Total Pay") || getProperty(s, "Pay") || 0;
      return pay ? `$${Number(pay).toLocaleString()}` : "$0";
    })(),
    payMethod: getProperty(s, "Pay Method") || getProperty(s, "Payment Method") || "—",
    payAccount: getProperty(s, "Pay Account") || getProperty(s, "Payment Account") || "—",
    lastShift: (() => {
      const d = getProperty(s, "Last Shift") || getProperty(s, "Last Date");
      return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    })(),
  }));

  const refs = refsData.map((r: any) => ({
    name: getProperty(r, "Name") || "—",
    gamesReffed: Number(getProperty(r, "Games Reffed") || getProperty(r, "Games") || getProperty(r, "Total Games")) || 0,
    totalPay: (() => {
      const pay = getProperty(r, "Total Pay") || getProperty(r, "Pay") || 0;
      return pay ? `$${Number(pay).toLocaleString()}` : "$0";
    })(),
    payMethod: getProperty(r, "Pay Method") || getProperty(r, "Payment Method") || "—",
    payAccount: getProperty(r, "Pay Account") || getProperty(r, "Payment Account") || "—",
    court: getProperty(r, "Court") || getProperty(r, "Courts") || "—",
    lastGame: (() => {
      const d = getProperty(r, "Last Game") || getProperty(r, "Last Date");
      return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    })(),
  }));

  if (staff.length === 0 && refs.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Staff & Refs</h1>
          <p className="text-text-secondary text-sm mt-1">Event Staff & Referee Management from Notion</p>
        </div>
        <NotionFallback type="empty" entityName="staff and referees" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Staff & Refs</h1>
        <p className="text-text-secondary text-sm mt-1">Event Staff & Referee Management from Notion</p>
      </div>
      <StaffClient staff={staff} refs={refs} />
    </div>
  );
}
