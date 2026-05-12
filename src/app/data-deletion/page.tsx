export const metadata = {
  title: "Data Deletion — ZhanCare.AI",
  description: "Request deletion of your ZhanCare.AI account and data",
};

export default function DataDeletionPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Data Deletion Request</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 12, 2026</p>

      <section className="mb-8">
        <p className="text-gray-600 leading-relaxed">
          You have the right to request deletion of your personal data from ZhanCare.AI at any time.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">How to Request Data Deletion</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Send an email to{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>{" "}
          with the subject line <strong>"Data Deletion Request"</strong> and include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Your full name</li>
          <li>The email address associated with your account</li>
          <li>Your phone number (if registered)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">What Gets Deleted</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Your account and login credentials</li>
          <li>Personal profile information</li>
          <li>Consultation history and chat records</li>
          <li>WhatsApp message history associated with your account</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Retention Exceptions</h2>
        <p className="text-gray-600 leading-relaxed">
          Medical records may be retained for up to 5 years as required by Kazakhstan healthcare law,
          even after an account deletion request. Payment records may be retained for tax and legal compliance purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Processing Time</h2>
        <p className="text-gray-600 leading-relaxed">
          We will process your deletion request within <strong>30 days</strong> and send a
          confirmation to your email address.
        </p>
      </section>
    </main>
  );
}
