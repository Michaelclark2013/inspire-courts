import type { Metadata } from "next";
import Link from "next/link";
import { FACILITY_EMAIL, FACILITY_ADDRESS, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | Inspire Courts AZ",
  description:
    "How Inspire Courts AZ collects, uses, and protects your personal information.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "November 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-off-white py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-text-secondary text-xs hover:text-navy flex items-center gap-1 mb-6"
        >
          ← Back to home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy font-heading mb-2">
          Privacy Policy
        </h1>
        <p className="text-text-secondary text-sm mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-navy max-w-none space-y-6 text-navy/90 leading-relaxed text-[15px]">
          <section>
            <p>
              Inspire Courts AZ (&quot;<strong>Inspire Courts</strong>,&quot;
              &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your
              privacy. This Privacy Policy explains what information we collect
              when you visit {SITE_URL} or sign up for any of our programs,
              tournaments, memberships, or rentals, and how we use that
              information.
            </p>
            <p>
              If you have any questions, email us at{" "}
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                className="text-red font-semibold hover:underline"
              >
                {FACILITY_EMAIL}
              </a>
              .
            </p>
          </section>

          <Section title="1. Information We Collect">
            <p className="mb-2">We collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Contact info</strong> — name, email, phone — from
                contact forms, booking requests, tournament registrations, and
                account signups.
              </li>
              <li>
                <strong>Player + guardian info</strong> — player name, date of
                birth, team, emergency contact, allergies — for waivers,
                check-ins, and roster management.
              </li>
              <li>
                <strong>Payment info</strong> — payment processing happens
                through Square, which receives the card data directly. We
                store only the payment status, amount, and Square order ID.
                We never see or store your full card number.
              </li>
              <li>
                <strong>Account info</strong> — if you create a user account,
                we store your email, name, phone, role (parent, coach, etc.),
                and a bcrypt-hashed password.
              </li>
              <li>
                <strong>Usage data</strong> — pages visited, device type, IP
                address, and referral source via Google Analytics (if enabled).
              </li>
              <li>
                <strong>Uploaded content</strong> — signed waiver images, team
                logos, and any files you upload through the portal.
              </li>
            </ul>
          </Section>

          <Section title="2. How We Use It">
            <ul className="list-disc pl-6 space-y-1">
              <li>Run your tournament, program, or facility rental.</li>
              <li>Send confirmations, schedule updates, and receipts.</li>
              <li>Comply with liability-waiver and safety requirements.</li>
              <li>
                Send occasional product news via Mailchimp — only if you opt in
                to the newsletter.
              </li>
              <li>
                Measure site traffic and improve the site via Google Analytics
                and Meta Pixel (aggregate data only).
              </li>
              <li>Process payments through Square.</li>
              <li>Investigate abuse, fraud, and rate-limit violations.</li>
            </ul>
          </Section>

          <Section title="3. Who We Share It With">
            <p className="mb-2">We share limited data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Square</strong> — for payment processing. See{" "}
                <a
                  href="https://squareup.com/legal/privacy-no-account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red hover:underline"
                >
                  Square&apos;s Privacy Notice
                </a>
                .
              </li>
              <li>
                <strong>Google</strong> — for Workspace (Drive, Sheets, OAuth
                sign-in) and Analytics. Files you upload may be stored in our
                Google Drive.
              </li>
              <li>
                <strong>Mailchimp</strong> — for newsletter delivery if you
                subscribe.
              </li>
              <li>
                <strong>Coaches and tournament organizers</strong> — roster
                and check-in info is visible to the coach of the team a player
                is registered with.
              </li>
              <li>
                <strong>Law enforcement or regulators</strong> — only when
                legally required.
              </li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell your personal information to
              third parties.
            </p>
          </Section>

          <Section title="4. Children's Privacy (COPPA)">
            <p>
              Our programs serve youth athletes. We collect the player&apos;s
              name, date of birth, and emergency contact only with verifiable
              parent or legal guardian consent — provided through the signed
              waiver and registration process. Parents can review, correct, or
              request deletion of a minor&apos;s data at any time by emailing{" "}
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                className="text-red hover:underline"
              >
                {FACILITY_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="5. Your Rights (CCPA / GDPR)">
            <p className="mb-2">
              Depending on where you live, you may have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal information we hold about you.</li>
              <li>Correct inaccuracies.</li>
              <li>Request deletion (see §7).</li>
              <li>Opt out of marketing emails at any time.</li>
              <li>Object to processing or request data portability.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                className="text-red hover:underline"
              >
                {FACILITY_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="6. Cookies and Tracking">
            <p>
              We use cookies for session authentication (required — the site
              won&apos;t work without them) and, if enabled, for Google
              Analytics and Meta Pixel (optional). You can disable cookies in
              your browser, but authenticated areas (portal, admin) require
              session cookies to function.
            </p>
          </Section>

          <Section title="7. Deleting Your Account">
            <p>
              Logged-in users can delete their account from{" "}
              <Link href="/portal/profile" className="text-red hover:underline">
                the portal profile page
              </Link>
              . Deletion removes your user row and unlinks you from any teams,
              players, scores, or announcements you&apos;ve touched. Audit-log
              entries (which record administrative actions) are retained for
              up to 2 years for compliance purposes.
            </p>
            <p className="mt-3">
              To delete a player or guardian record (not linked to a user
              account), email{" "}
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                className="text-red hover:underline"
              >
                {FACILITY_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="8. Data Retention">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Waivers</strong> — retained for the life of the
                athlete&apos;s participation plus 2 years (for liability
                defense).
              </li>
              <li>
                <strong>Payment records</strong> — 7 years (IRS).
              </li>
              <li>
                <strong>Audit logs</strong> — up to 2 years.
              </li>
              <li>
                <strong>Marketing lists</strong> — until you unsubscribe.
              </li>
            </ul>
          </Section>

          <Section title="9. Security">
            <p>
              We protect your data with HTTPS in transit, bcrypt-hashed
              passwords at rest, rate limiting on authentication endpoints,
              and role-based access controls on the admin dashboard. No system
              is perfectly secure — if you suspect your account has been
              compromised, reset your password immediately and notify us.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We&apos;ll update this page if our practices change. Significant
              changes will also be communicated by email to registered users.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Inspire Courts AZ
              <br />
              {FACILITY_ADDRESS.full}
              <br />
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                className="text-red hover:underline"
              >
                {FACILITY_EMAIL}
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold text-navy font-heading uppercase tracking-tight mb-3 mt-8">
        {title}
      </h2>
      {children}
    </section>
  );
}
