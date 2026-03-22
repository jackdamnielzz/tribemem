import React from 'react';

export const metadata = {
  title: 'Privacy Policy — TribeMem',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">Last updated: March 22, 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Account information:</strong> name, email address, and password when you create an account
            </li>
            <li>
              <strong>Organization data:</strong> organization name, team members, and roles
            </li>
            <li>
              <strong>Connected service data:</strong> data retrieved from third-party services you connect (Slack,
              Notion, GitHub, etc.) for knowledge extraction
            </li>
            <li>
              <strong>Usage data:</strong> queries, API calls, and feature usage for billing and analytics
            </li>
            <li>
              <strong>Technical data:</strong> IP address, browser type, and device information
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process knowledge extraction from connected services</li>
            <li>Respond to AI-powered queries with relevant knowledge</li>
            <li>Process billing and manage subscriptions</li>
            <li>Send transactional emails (account verification, alerts, digests)</li>
            <li>Monitor and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">3. Data Storage and Security</h2>
          <p>
            Your data is stored in Supabase (PostgreSQL) with row-level security policies ensuring organization-level
            data isolation. OAuth credentials for connected services are encrypted using AES-256-GCM. All data is
            transmitted over HTTPS/TLS.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <strong>Supabase:</strong> database, authentication, and storage
            </li>
            <li>
              <strong>Stripe:</strong> payment processing
            </li>
            <li>
              <strong>Vercel:</strong> web hosting and deployment
            </li>
            <li>
              <strong>OpenAI / Anthropic:</strong> AI-powered knowledge extraction and query synthesis
            </li>
          </ul>
          <p>
            Each third-party service has its own privacy policy governing its handling of your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">5. Data from Connected Services</h2>
          <p>
            When you connect third-party services (Slack, Notion, GitHub, etc.), we access and process data from
            those services solely for the purpose of knowledge extraction. We store extracted knowledge units and
            metadata. You can disconnect a service and request deletion of associated data at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. When you delete your account or organization,
            we will delete your data within 30 days. Billing records may be retained longer as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to processing of your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">8. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use advertising or tracking
            cookies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">9. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed at children under 16. We do not knowingly collect data from children under 16.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes via email or
            through the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">11. Contact</h2>
          <p>
            For questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@tribemem.com" className="text-primary hover:underline">
              privacy@tribemem.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
