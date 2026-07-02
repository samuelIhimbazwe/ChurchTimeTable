import Link from 'next/link'

export const metadata = {
  title: 'Terms and Conditions — CMMS',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-raised px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/login" className="text-sm text-primary-600 hover:underline">
            ← Back to sign in
          </Link>
        </div>

        <h1 className="font-display text-3xl text-text-primary">Terms and Conditions</h1>
        <p className="text-sm text-text-secondary">
          Last updated: June 2026
        </p>

        <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
          <section>
            <h2 className="text-lg font-semibold text-text-primary">1. Acceptance</h2>
            <p>
              By accepting an invite or signing in to the Church Management &amp; Coordination System
              (CMMS), you agree to use the platform responsibly and in accordance with your
              church&apos;s policies and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary">2. Account information</h2>
            <p>
              You agree to provide accurate personal information, including your national ID and
              phone number, and to keep your login credentials secure. You are responsible for
              activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary">3. Ministry access</h2>
            <p>
              Registration is by administrator invite only. Church leaders grant choir and protocol
              access when sending your invite. Elevated officer roles are assigned separately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary">4. Data use</h2>
            <p>
              Your information may be used for church administration, ministry coordination,
              attendance, contributions, and communications related to church activities. Sensitive
              data is handled according to church governance and privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary">5. Contact</h2>
            <p>
              For questions about these terms or your account, contact your church administration
              office.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
