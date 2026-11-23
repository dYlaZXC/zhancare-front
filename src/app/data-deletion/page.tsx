export const metadata = {
  title: "Data Deletion — ZhanCare.AI",
  description: "Request deletion of your ZhanCare.AI account and data",
};

export default function DataDeletionPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Data Deletion Request</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 2026</p>

      <section className="mb-8">
        <p className="text-gray-600 leading-relaxed">
          Under the Law of the Republic of Kazakhstan &ldquo;On Personal Data and Their
          Protection,&rdquo; you have the right to request deletion of your personal data
          from ZhanCare.AI at any time. We will process verified requests promptly and
          in accordance with applicable law.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">How to Request Data Deletion</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Send an email to{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>{" "}
          with the subject line <strong>&ldquo;Data Deletion Request&rdquo;</strong> and include:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Your full name</li>
          <li>The email address associated with your account</li>
          <li>Your phone number (if registered)</li>
          <li>A brief description of what you would like deleted (full account, specific data, etc.)</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mt-4">
          We may ask you to verify your identity before processing the request to protect
          against unauthorised deletion.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">What Gets Deleted</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Upon a verified deletion request, we will delete or permanently anonymise:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Your account and login credentials</li>
          <li>Personal profile information (name, email, phone number)</li>
          <li>AI chat history and symptom checking records</li>
          <li>WhatsApp message history associated with your account</li>
          <li>Any uploaded files or documents linked to your profile</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Retention Exceptions</h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Certain data may be retained even after a deletion request where required by law:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>
            <strong>Medical records:</strong> Health-related consultation records are retained
            for the period required by applicable Kazakhstani healthcare regulations. After
            this period, records will be securely deleted.
          </li>
          <li>
            <strong>Payment records:</strong> Transaction records may be retained for the
            period required for tax and accounting compliance under Kazakhstani law.
          </li>
          <li>
            <strong>Legal holds:</strong> Data subject to an active legal investigation or
            court order may be retained until the matter is resolved.
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed mt-3">
          We will inform you which data cannot be deleted immediately and the reason why.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Third-Party Data</h2>
        <p className="text-gray-600 leading-relaxed">
          If you have interacted with ZhanCare.AI via WhatsApp, some message data is also
          held by Meta Platforms under their own data policies. To request deletion from
          Meta, please use{" "}
          <a
            href="https://www.whatsapp.com/legal/privacy-policy"
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp&apos;s data deletion process
          </a>. Our deletion of data on our own systems does not automatically remove data
          held by third-party providers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Processing Time</h2>
        <p className="text-gray-600 leading-relaxed">
          We will acknowledge your request within <strong>5 business days</strong> and
          complete processing within <strong>30 days</strong> of identity verification.
          A confirmation will be sent to your email address once deletion is complete.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Questions</h2>
        <p className="text-gray-600 leading-relaxed">
          For questions about your data or this process, contact us at{" "}
          <a href="mailto:info@zhan.care" className="text-blue-600 underline">info@zhan.care</a>.
          You also have the right to lodge a complaint with the relevant Kazakhstani
          supervisory authority if you believe your data rights have not been respected.
        </p>
      </section>
    </main>
  );
}
