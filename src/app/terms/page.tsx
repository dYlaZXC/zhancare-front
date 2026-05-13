export const metadata = {
  title: "Terms of Service — ZhanCare.AI",
  description: "Terms of Service for ZhanCare.AI medical platform",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p className="text-gray-600 leading-relaxed">
          By accessing or using ZhanCare.AI, you confirm that you have read, understood, and agree
          to be bound by these Terms of Service and our{" "}
          <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>. If you do not
          agree, please do not use our platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Services</h2>
        <p className="text-gray-600 leading-relaxed">
          ZhanCare.AI provides a digital health platform including online consultations with
          licensed medical professionals, AI-assisted symptom checking (for informational purposes
          only), and home nursing visit coordination in Kazakhstan. The platform facilitates
          connections between patients and independent healthcare professionals; it does not
          directly provide medical treatment.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Medical Disclaimer</h2>
        <p className="text-gray-600 leading-relaxed">
          The content and services provided through ZhanCare.AI, including AI-assisted symptom
          checking, are for informational and facilitation purposes only. They do not constitute
          medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional
          before making any medical decisions. Do not disregard professional medical advice or delay
          seeking it because of information provided on this platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Emergency Use</h2>
        <p className="text-gray-600 leading-relaxed">
          <strong>ZhanCare.AI is not an emergency service.</strong> If you or someone else is
          experiencing a medical emergency, call <strong>103</strong> (ambulance) or your local
          emergency number immediately. Do not rely on this platform for emergency medical care.
          The AI symptom checker and online consultations are not designed for use in
          life-threatening situations.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Healthcare Professionals</h2>
        <p className="text-gray-600 leading-relaxed">
          Doctors and nurses available on ZhanCare.AI are independently licensed healthcare
          professionals. ZhanCare.AI verifies credentials but does not directly employ these
          professionals or guarantee specific clinical outcomes. Each healthcare professional
          is responsible for their own clinical decisions and professional conduct in accordance
          with applicable Kazakhstani law and medical standards.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. AI Limitations</h2>
        <p className="text-gray-600 leading-relaxed">
          Our AI assistant is a tool to help you explore symptoms and navigate healthcare options.
          It is not a licensed medical professional and cannot replace clinical judgment. AI
          responses may be incomplete, inaccurate, or not applicable to your specific situation.
          All AI-generated information should be reviewed with a qualified doctor before acting
          on it. ZhanCare.AI continuously works to improve AI accuracy but makes no guarantees
          regarding the completeness or correctness of AI-generated content.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. User Responsibilities</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Provide accurate and complete personal and medical information</li>
          <li>Keep your account credentials confidential and notify us of any unauthorized access</li>
          <li>Use the platform only for lawful purposes and in compliance with applicable Kazakhstani law</li>
          <li>Not misuse or abuse the AI chat, messaging, or consultation features</li>
          <li>Not use the platform as a substitute for emergency medical services</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Payments</h2>
        <p className="text-gray-600 leading-relaxed">
          Consultation fees are charged at the rates displayed at the time of booking.
          All prices are in Kazakhstani Tenge (KZT) unless otherwise stated. Refunds are
          handled on a case-by-case basis in accordance with our refund policy. Contact{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>{" "}
          for refund requests.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
        <p className="text-gray-600 leading-relaxed">
          ZhanCare.AI strives to provide a reliable and high-quality platform. However, to the
          extent permitted by applicable law, ZhanCare.AI shall not be liable for clinical
          decisions made by healthcare professionals during consultations, or for any outcomes
          arising from the use of AI-generated information. Our liability for platform-related
          technical issues is limited to the amount paid for the specific service in question.
          Nothing in these terms limits liability that cannot be excluded under Kazakhstani law.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
        <p className="text-gray-600 leading-relaxed">
          These Terms of Service are governed by and construed in accordance with the laws of
          the Republic of Kazakhstan, including the Law of the Republic of Kazakhstan{" "}
          &ldquo;On Personal Data and Their Protection.&rdquo; Any disputes arising from the use
          of this platform shall be subject to the jurisdiction of the courts of Almaty,
          Republic of Kazakhstan.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
        <p className="text-gray-600 leading-relaxed">
          We may update these terms from time to time to reflect changes in our services or
          applicable law. We will notify registered users of material changes via email.
          Continued use of the platform after changes constitutes acceptance of the updated terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">12. Contact</h2>
        <p className="text-gray-600 leading-relaxed">
          Questions about these terms:{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>
        </p>
      </section>
    </main>
  );
}
