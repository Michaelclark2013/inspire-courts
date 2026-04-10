import Link from "next/link";
import { Camera, Mail, MapPin, Phone } from "lucide-react";

const QUICK_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/facility", label: "Facility" },
  { href: "/prep", label: "Inspire Prep" },
  { href: "/teams", label: "Inspire Club" },
  { href: "/training", label: "Training" },
  { href: "/media", label: "Media" },
  { href: "/schedule", label: "Schedules" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer>
      {/* Main footer — navy */}
      <div className="bg-navy text-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red rounded-full flex items-center justify-center border-2 border-white">
                  <span className="font-bold text-sm font-[var(--font-chakra)]">IC</span>
                </div>
                <span className="font-[var(--font-chakra)] font-bold text-lg uppercase tracking-wide">
                  Inspire Courts
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Arizona&apos;s premier indoor basketball facility. 7 courts.
                52,000 sq ft. Built for competitors.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wider mb-5">
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/60 hover:text-white text-sm transition-colors hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wider mb-5">
                Contact
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3 text-white/60 text-sm">
                  <Mail className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                  <a href="mailto:InspireCourts@gmail.com" className="hover:text-white transition-colors">
                    InspireCourts@gmail.com
                  </a>
                </div>
                <div className="flex gap-3 text-white/60 text-sm">
                  <MapPin className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                  <div>
                    <p>1090 N Fiesta Blvd</p>
                    <p>Ste 101 & 102</p>
                    <p>Gilbert, AZ 85233</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wider mb-5">
                Follow Us
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Stay updated with everything Inspire Courts!
              </p>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/inspirecourtsaz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-navy-light rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red transition-all"
                  aria-label="Instagram"
                >
                  <Camera className="w-5 h-5" />
                </a>
                <a
                  href="https://instagram.com/azfinestmixtape"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-navy-light rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red transition-all"
                  aria-label="AZ Finest Mixtape"
                >
                  <Camera className="w-5 h-5" />
                </a>
                <a
                  href="mailto:InspireCourts@gmail.com"
                  className="w-10 h-10 bg-navy-light rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red transition-all"
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer — white */}
      <div className="bg-white border-t border-light-gray">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} Inspire Courts AZ. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">
            Gilbert, Arizona &mdash; Built for competitors.
          </p>
        </div>
      </div>
    </footer>
  );
}
