import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quick links | Inspire Courts AZ" };

const LINK_SECTIONS = [
  {
    title: "Operations",
    links: [
      { name: "Notion Operations Hub", url: "https://notion.so", desc: "Central operations database" },
      { name: "Square Dashboard", url: "https://squareup.com/dashboard", desc: "Payment processing & POS" },
      { name: "Google Drive", url: "https://drive.google.com", desc: "Shared files & documents" },
      { name: "Make.com", url: "https://make.com", desc: "Automation workflows" },
    ],
  },
  {
    title: "Marketing & Social",
    links: [
      { name: "Mailchimp", url: "https://mailchimp.com", desc: "Email marketing & lists" },
      { name: "Vercel Dashboard", url: "https://vercel.com/dashboard", desc: "Hosting & deployments" },
      { name: "Instagram @inspirecourtsaz", url: "https://instagram.com/inspirecourtsaz", desc: "Main brand account" },
      { name: "Instagram @azfinestmixtape", url: "https://instagram.com/azfinestmixtape", desc: "Content & highlights" },
    ],
  },
];

export default async function LinksPage() {
  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
          Quick Links
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          External tools and platforms
        </p>
      </div>

      <div className="space-y-8">
        {LINK_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-navy/70 text-xs font-bold uppercase tracking-wider mb-3">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.links.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-off-white border border-border rounded-xl p-5 hover:border-red/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-navy font-bold text-sm group-hover:text-red transition-colors">
                      {link.name}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-text-secondary group-hover:text-red transition-colors flex-shrink-0" aria-hidden="true" />
                  </div>
                  <p className="text-text-secondary text-xs">{link.desc}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
