export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-gray-700">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          The Manifestor ("we", "us", or "our") operates this website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information Collection and Use</h2>
        <p>
          We collect several different types of information for various purposes to provide and improve our Service to you. If you authenticate with Google, we store your email address and profile information provided by Google.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cookies</h2>
        <p>
          We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Security of Data</h2>
        <p>
          The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us.
        </p>
      </div>
    </div>
  );
}
