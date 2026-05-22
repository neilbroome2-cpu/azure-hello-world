import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#005EB8] flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oakley Medical Practice</h1>
        <p className="text-gray-500 text-sm mb-8">Online Patient Services</p>
        <Link
          href="/psa-consent"
          className="block w-full bg-[#005EB8] hover:bg-[#004a93] text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
        >
          PSA Blood Test — Information &amp; Consent
        </Link>
        <p className="text-xs text-gray-400 mt-8">Oakley · Fife · KY12 · 01383 850212</p>
      </div>
    </div>
  );
}
