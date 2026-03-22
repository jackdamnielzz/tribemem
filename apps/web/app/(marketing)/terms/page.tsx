import React from 'react';

export const metadata = {
  title: 'Terms of Service — TribeMem',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
      <p className="mb-4 text-sm text-muted-foreground">Last updated: March 22, 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TribeMem (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">2. Description of Service</h2>
          <p>
            TribeMem is an autonomous knowledge crawler platform that connects to your team&apos;s tools, extracts
            knowledge, and makes it searchable via AI-powered queries. The Service includes web access, API access,
            SDK, and MCP server integrations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">3. Accounts</h2>
          <p>
            You must provide accurate information when creating an account. You are responsible for maintaining the
            security of your account credentials. You must notify us immediately of any unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Use the Service to store or transmit malicious code</li>
            <li>Interfere with or disrupt the integrity of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">5. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. By using TribeMem, you consent to the
            collection and use of data as described in our Privacy Policy. You retain ownership of all data you
            provide to the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">6. Subscriptions and Billing</h2>
          <p>
            Paid plans are billed in advance on a monthly or annual basis. You may cancel your subscription at any
            time. Refunds are handled on a case-by-case basis. We reserve the right to change pricing with 30 days
            notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">7. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by TribeMem and are protected
            by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, TribeMem shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
            directly or indirectly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">9. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violations of these terms. Upon termination,
            your right to use the Service will immediately cease. You may export your data before termination.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of material changes via
            email or through the Service. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">11. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:support@tribemem.com" className="text-primary hover:underline">
              support@tribemem.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
