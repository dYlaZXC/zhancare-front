export const metadata = {
  title: "Privacy Policy — ZhanCare.AI",
  description: "Privacy Policy for ZhanCare.AI medical platform",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 12, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Who We Are</h2>
        <p className="text-gray-600 leading-relaxed">
          ZhanCare.AI is a digital healthcare platform providing online medical consultations,
          AI-assisted symptom checking, and home nursing visit coordination. Our website is{" "}
          <a href="https://www.zhan.care" className="text-blue-600 underline">https://www.zhan.care</a>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Name, email address, and phone number when you register</li>
          <li>Medical information you voluntarily provide (symptoms, history)</li>
          <li>Consultation records and appointment details</li>
          <li>Device and browser information for security purposes</li>
          <li>WhatsApp messages sent to our business number for support</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>To provide and improve our medical consultation services</li>
          <li>To connect you with healthcare professionals</li>
          <li>To send appointment reminders and service notifications</li>
          <li>To respond to your support requests via WhatsApp or email</li>
          <li>To comply with applicable healthcare laws and regulations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. WhatsApp Messaging</h2>
        <p className="text-gray-600 leading-relaxed">
          When you contact us via WhatsApp, your message is processed through Meta&apos;s WhatsApp
          Business API. This service uses a secure service from Meta to manage chats. Messages
          may be used to provide automated support responses and are handled in accordance with
          Meta&apos;s{" "}
          <a href="https://www.whatsapp.com/legal/privacy-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            WhatsApp Privacy Policy
          </a>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
        <p className="text-gray-600 leading-relaxed">
          We do not sell your personal data. We may share data with:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 mt-2">
          <li>Healthcare professionals you book consultations with</li>
          <li>Cloud infrastructure providers (for hosting and storage)</li>
          <li>Meta Platforms (for WhatsApp messaging services)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
        <p className="text-gray-600 leading-relaxed">
          We retain your data for as long as your account is active or as required by law.
          Medical records are kept for a minimum of 5 years in accordance with healthcare regulations.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data (see our <a href="/data-deletion" className="text-blue-600 underline">Data Deletion page</a>)</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Security</h2>
        <p className="text-gray-600 leading-relaxed">
          We use industry-standard encryption and security practices to protect your data.
          All data is transmitted over HTTPS and stored on secure servers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
        <p className="text-gray-600 leading-relaxed">
          For privacy-related questions, contact us at:{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>
        </p>
      </section>
    </main>
  );
}
