import type { Metadata } from "next";
import Link from "next/link";
import { FACILITY_EMAIL, FACILITY_ADDRESS, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service | Inspire Courts AZ",
  description:
    "The terms governing use of Inspire Courts AZ programs, tournaments, memberships, and rentals.",
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "April 2026";

const termsBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Terms", item: `${SITE_URL}/terms` },
  ],
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-off-white py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsBreadcrumbLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-text-secondary text-xs hover:text-navy flex items-center gap-1 mb-6"
        >
          ← Back to home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-navy font-heading mb-2">
          Terms of Service
        </h1>
        <p className="text-text-secondary text-sm mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-navy max-w-none space-y-6 text-navy/90 leading-relaxed text-[15px]">
          <section>
            <p>
              These Terms of Service (&quot;<strong>Terms</strong>&quot;) govern
              your access to and use of the Inspire Courts AZ website at{" "}
              {SITE_URL} and any related programs, tournaments, memberships,
              open gym, rentals, or services (collectively, the
              &quot;<strong>Services</strong>&quot;). By using our Services,
              you agree to these Terms. If you don&apos;t agree, don&apos;t
              use the Services.
            </p>
          </section>

          <Section title="1. Who We Are">
            <p>
              The Services are operated by Inspire Courts AZ, an Arizona
              entity with its principal facility at {FACILITY_ADDRESS.full}.
              Contact us at{" "}
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                className="text-red hover:underline"
              >
                {FACILITY_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="2. Eligibility + Accounts">
            <p>
              You must be at least 18 years old to create an account on your
              own. Anyone under 18 must have a parent or legal guardian
              register on their behalf. You are responsible for all activity
              under your account, so keep your password safe. Notify us
              immediately if you suspect unauthorized access.
            </p>
          </Section>

          <Section title="3. Registrations, Payments, and Refunds">
            <p className="mb-2">
              Tournament and program registrations are confirmed only after
              payment is received through Square. Refund policies vary by
              event:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Tournament withdrawals</strong> — up to 7 days before
                the event: full refund minus processing fees. Within 7 days:
                no refund unless the event is cancelled by Inspire Courts.
              </li>
              <li>
                <strong>Camps and clinics</strong> — refunds available up to
                14 days before the first session, minus a 10% administrative
                fee.
              </li>
              <li>
                <strong>Memberships</strong> — cancel anytime; unused days are
                not prorated.
              </li>
              <li>
                <strong>Facility rentals</strong> — policies are listed in the
                rental agreement.
              </li>
            </ul>
            <p className="mt-3">
              Fees are in U.S. dollars. Prices may change with 30 days&apos;
              notice for ongoing memberships.
            </p>
          </Section>

          <Section title="4. Waivers, Safety, and Assumption of Risk">
            <p>
              Basketball, volleyball, and other court activities involve
              inherent risks of injury. Every participant (or their guardian)
              must sign the{" "}
              <Link href="/waiver" className="text-red hover:underline">
                Inspire Courts liability waiver
              </Link>{" "}
              before participating. By participating, you acknowledge and
              voluntarily assume these risks.
            </p>
            <p className="mt-3">
              Inspire Courts reserves the right to refuse entry to anyone who
              is unsafe, impaired, or who has not signed a current waiver.
            </p>
          </Section>

          <Section title="5. Code of Conduct">
            <p className="mb-2">
              When you&apos;re on the premises or using the Services, you
              agree to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Follow all staff, referee, and coach instructions.</li>
              <li>Respect players, coaches, officials, and spectators.</li>
              <li>
                Not use abusive language, threats, harassment, or physical
                violence.
              </li>
              <li>Not bring weapons, drugs, alcohol, or tobacco.</li>
              <li>Not record or photograph minors who are not your own.</li>
              <li>Not interfere with games, practices, or other events.</li>
            </ul>
            <p className="mt-3">
              Inspire Courts may eject or ban individuals for violations,
              without refund. Severe or criminal conduct will be reported to
              local law enforcement.
            </p>
          </Section>

          <Section title="6. Use of the Website">
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Attempt to reverse-engineer, scrape, or overload the site.</li>
              <li>Register multiple fake accounts.</li>
              <li>
                Submit false information on registrations, waivers, or any
                form.
              </li>
              <li>
                Upload content that is unlawful, infringing, or
                objectionable.
              </li>
              <li>Attempt to access accounts or data that isn&apos;t yours.</li>
            </ul>
          </Section>

          <Section title="7. User-Submitted Content">
            <p>
              If you submit photos, signatures, team logos, or other content,
              you grant Inspire Courts a non-exclusive license to use that
              content to operate the Services (display your team logo in
              brackets, show your signature on your waiver, etc.). You
              represent that you have the rights to submit the content.
            </p>
          </Section>

          <Section title="8. Photography and Media">
            <p>
              Inspire Courts and authorized photographers may capture photos
              and video at the facility during tournaments and events. By
              participating, you grant permission for Inspire Courts to use
              such footage for promotional purposes. If you prefer your
              athlete not be photographed, notify staff at check-in and we
              will make reasonable efforts to accommodate.
            </p>
          </Section>

          <Section title="9. Disclaimers">
            <p>
              The Services are provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, express or
              implied. We don&apos;t guarantee that live scores, schedules, or
              brackets are always accurate in real time — always confirm
              game-day details with on-site staff.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, Inspire Courts&apos;
              total liability for any claim arising from your use of the
              Services is limited to the amount you paid Inspire Courts in the
              12 months before the claim arose. We are not liable for
              indirect, incidental, consequential, or punitive damages.
            </p>
            <p className="mt-3">
              This section does not limit liability for injuries covered by
              our liability waiver or required by Arizona law.
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to indemnify and hold Inspire Courts, its staff, and
              its affiliates harmless from any claim arising out of your
              violation of these Terms, your misuse of the Services, or your
              conduct at the facility.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              We may suspend or terminate your account or ban you from the
              facility if you violate these Terms, the Code of Conduct, or the
              waiver. You may delete your account at any time from{" "}
              <Link href="/portal/profile" className="text-red hover:underline">
                the portal profile page
              </Link>
              .
            </p>
          </Section>

          <Section title="13. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Arizona,
              without regard to conflict-of-law rules. Any dispute will be
              resolved in state or federal courts located in Maricopa County,
              Arizona, and you consent to that jurisdiction.
            </p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>
              We may update these Terms from time to time. The &quot;Last
              updated&quot; date at the top reflects the most recent change.
              Material changes will be emailed to registered users. Continued
              use of the Services after changes take effect constitutes
              acceptance.
            </p>
          </Section>

          <Section title="15. Contact">
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
