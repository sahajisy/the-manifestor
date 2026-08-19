export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="space-y-4 text-gray-700">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          Please read these Terms of Service ("Terms", "Terms of Service") carefully before using The Manifestor website (the "Service") operated by us.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Accounts</h2>
        <p>
          When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Termination</h2>
        <p>
          We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Limitation of Liability</h2>
        <p>
          In no event shall we, nor our directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Changes</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us.
        </p>
      </div>
    </div>
  );
}
