export const metadata = {
  title: "Terms of Service — ZhanCare.AI",
  description: "Terms of Service for ZhanCare.AI medical platform",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 12, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p className="text-gray-600 leading-relaxed">
          By using ZhanCare.AI, you agree to these Terms of Service. If you do not agree,
          please do not use our platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Services</h2>
        <p className="text-gray-600 leading-relaxed">
          ZhanCare.AI provides a digital health platform including online consultations with
          licensed medical professionals, AI-assisted symptom checking (for informational purposes
          only), and home nursing visit coordination in Kazakhstan.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Medical Disclaimer</h2>
        <p className="text-gray-600 leading-relaxed">
          AI symptom checking is for informational purposes only and does not constitute
          medical advice, diagnosis, or treatment. Always consult a qualified healthcare
          professional for medical decisions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Provide accurate personal and medical information</li>
          <li>Keep your account credentials confidential</li>
          <li>Use the platform only for lawful purposes</li>
          <li>Not misuse or abuse the AI chat or messaging features</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Payments</h2>
        <p className="text-gray-600 leading-relaxed">
          Consultation fees are charged at the rates displayed at the time of booking.
          Refunds are handled on a case-by-case basis. Contact{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>{" "}
          for refund requests.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
        <p className="text-gray-600 leading-relaxed">
          ZhanCare.AI is not liable for any medical outcomes resulting from consultations or
          AI recommendations. Our liability is limited to the amount paid for the specific service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Changes to Terms</h2>
        <p className="text-gray-600 leading-relaxed">
          We may update these terms from time to time. Continued use of the platform after
          changes constitutes acceptance of the new terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
        <p className="text-gray-600 leading-relaxed">
          Questions about these terms:{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>
        </p>
      </section>
    </main>
  );
}
