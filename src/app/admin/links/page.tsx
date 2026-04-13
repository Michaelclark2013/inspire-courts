import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ExternalLink } from "lucide-react";

const QUICK_LINKS = [
  { name: "Notion Operations Hub", url: "https://notion.so", desc: "Central operations database" },
  { name: "Square Dashboard", url: "https://squareup.com/dashboard", desc: "Payment processing & POS" },
  { name: "Mailchimp", url: "https://mailchimp.com", desc: "Email marketing & lists" },
  { name: "Google Drive", url: "https://drive.google.com", desc: "Shared files & documents" },
  { name: "Make.com", url: "https://make.com", desc: "Automation workflows" },
  { name: "Vercel Dashboard", url: "https://vercel.com/dashboard", desc: "Hosting & deployments" },
  { name: "Instagram @inspirecourtsaz", url: "https://instagram.com/inspirecourtsaz", desc: "Main brand account" },
  { name: "Instagram @azfinestmixtape", url: "https://instagram.com/azfinestmixtape", desc: "Content & highlights" },
];

export default async function LinksPage() {
  const session = await getServerSession(authOptions);
  // Auth temporarily disabled

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Quick Links
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          External tools and platforms
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-bg-secondary border border-border rounded-sm p-5 hover:border-accent/50 transition-all group hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-bold text-sm group-hover:text-accent transition-colors">
                {link.name}
              </h3>
              <ExternalLink className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors flex-shrink-0" />
            </div>
            <p className="text-text-secondary text-xs">{link.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
