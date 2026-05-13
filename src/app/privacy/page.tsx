export const metadata = {
  title: "Privacy Policy — ZhanCare.AI",
  description: "Privacy Policy for ZhanCare.AI medical platform",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Who We Are</h2>
        <p className="text-gray-600 leading-relaxed">
          ZhanCare.AI is a digital healthcare platform providing online medical consultations,
          AI-assisted symptom checking, and home nursing visit coordination, operating in the
          Republic of Kazakhstan. Our website is{" "}
          <a href="https://www.zhan.care" className="text-blue-600 underline">https://www.zhan.care</a>.
          We process personal data in accordance with the Law of the Republic of Kazakhstan
          &ldquo;On Personal Data and Their Protection.&rdquo;
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          We collect the following categories of personal data, including{" "}
          <strong>health-related and sensitive personal data</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Name, email address, and phone number when you register</li>
          <li>
            Health-related information you voluntarily provide — symptoms, medical history,
            and other sensitive personal data shared during consultations or AI symptom checking
          </li>
          <li>Consultation records, appointment details, and session notes</li>
          <li>Device and browser information for security and service improvement purposes</li>
          <li>WhatsApp messages sent to our business number for support or appointment notifications</li>
          <li>Payment records (processed securely; full card details are never stored by us)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>To provide and improve our medical consultation and AI services</li>
          <li>To connect you with appropriate healthcare professionals</li>
          <li>To send appointment reminders and service-related notifications</li>
          <li>To respond to your support requests via WhatsApp or email</li>
          <li>To fulfil our legal obligations under applicable healthcare and data protection law</li>
          <li>To ensure platform security and prevent fraud</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Legal Basis and Consent</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          We process your personal data on the following legal bases:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>
            <strong>Consent:</strong> By registering and using the platform, you consent to
            the processing of your personal data, including health-related sensitive data,
            for the purposes described in this policy. You may withdraw consent at any time
            by contacting us at{" "}
            <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>.
          </li>
          <li>
            <strong>Contract performance:</strong> Processing necessary to provide the services
            you have requested (booking consultations, sending reminders).
          </li>
          <li>
            <strong>Legal obligation:</strong> Processing required to comply with applicable
            Kazakhstani healthcare and data protection law.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Data Storage Location</h2>
        <p className="text-gray-600 leading-relaxed">
          Your personal data, including health-related information, is stored within the
          Republic of Kazakhstan. We use Yandex Cloud Object Storage hosted in the{" "}
          <strong>Kazakhstan region (kz1)</strong>, ensuring that your data remains within
          Kazakhstani jurisdiction in compliance with applicable data localisation requirements.
          Our primary database servers are also located within Kazakhstan.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Data Sharing</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          We do not sell your personal data. We may share data only as necessary with:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Healthcare professionals you book consultations with, for care delivery purposes</li>
          <li>
            Cloud infrastructure providers for hosting and file storage (see Section 7 for details)
          </li>
          <li>
            Meta Platforms for WhatsApp messaging services (see Section 7 for details)
          </li>
          <li>Payment processors, solely for transaction processing</li>
          <li>
            Public authorities, when required by law or a binding court order
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. International Service Providers</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Some of our service providers are based outside Kazakhstan. We take steps to ensure
          appropriate safeguards are in place for any such transfers:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>
            <strong>Yandex Cloud (kz1 region):</strong> Used for object and file storage.
            Data is stored in Kazakhstan. Governed by Yandex Cloud&apos;s data processing terms.
          </li>
          <li>
            <strong>Meta Platforms (WhatsApp Business API):</strong> Used for appointment
            notifications and support messaging. Messages processed through Meta&apos;s
            infrastructure are subject to Meta&apos;s{" "}
            <a href="https://www.whatsapp.com/legal/privacy-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              WhatsApp Privacy Policy
            </a>. We share only the minimum necessary data (phone number, appointment details)
            for notification purposes.
          </li>
          <li>
            <strong>Mistral AI:</strong> Used to power our AI symptom checking assistant.
            Queries may be processed on Mistral&apos;s European infrastructure. We do not
            send identifying personal data (name, contact details) to the AI provider —
            only anonymised symptom descriptions provided during the chat session.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
        <p className="text-gray-600 leading-relaxed">
          We retain your personal data for as long as your account is active or as required
          by applicable regulations. Health-related records are retained for the period required
          by Kazakhstani healthcare regulations. When data is no longer required, it is securely
          deleted or anonymised. You may request deletion of your data at any time — see our{" "}
          <a href="/data-deletion" className="text-blue-600 underline">Data Deletion page</a>{" "}
          for details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Children</h2>
        <p className="text-gray-600 leading-relaxed">
          ZhanCare.AI is not directed at children under the age of 18. We do not knowingly
          collect personal data from minors without verifiable parental or guardian consent.
          If you believe a minor has provided us with personal data without consent, please
          contact us at{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>{" "}
          and we will promptly delete such data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. Security</h2>
        <p className="text-gray-600 leading-relaxed">
          We use industry-standard encryption and security practices to protect your data.
          All data is transmitted over HTTPS and stored on secure servers within Kazakhstan.
          Access to health-related data is restricted to authorised personnel and the
          healthcare professional involved in your care.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">11. Your Rights</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Under the Law of the Republic of Kazakhstan &ldquo;On Personal Data and Their
          Protection,&rdquo; you have the right to:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate or incomplete data</li>
          <li>Request deletion of your data (see our <a href="/data-deletion" className="text-blue-600 underline">Data Deletion page</a>)</li>
          <li>Withdraw consent to data processing at any time</li>
          <li>Lodge a complaint with the relevant Kazakhstani supervisory authority</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mt-3">
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>.
          We will respond within 30 days.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
        <p className="text-gray-600 leading-relaxed">
          For privacy-related questions or to exercise your rights, contact us at:{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>
        </p>
      </section>
    </main>
  );
}
