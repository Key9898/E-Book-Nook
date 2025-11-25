interface HelpAndInfoProps { onNavigate?: (page: string) => void }

export default function HelpAndInfo({ onNavigate }: HelpAndInfoProps) {
  return (
    <div className="px-2 sm:px-4 lg:px-8 rounded-xl pt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-white ring-1 ring-black/5 shadow p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-gray-900">Help & Info</h2>
          <p className="mt-2 text-gray-700">This section provides helpful information for users, including FAQs, policies and a way to share feedback.</p>
        </div>

        <div className="rounded-xl bg-white ring-1 ring-black/5 shadow p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-gray-900">Feedback</h3>
          <p className="mt-2 text-gray-700">Share your thoughts and help us improve the experience.</p>
          <button type="button" onClick={() => onNavigate?.('feedbacks')} className="mt-4 rounded-xl bg-cyan-700 text-white px-4 py-2 font-semibold shadow hover:bg-cyan-600">Go to Feedback</button>
        </div>

        <div className="rounded-xl bg-white ring-1 ring-black/5 shadow p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-gray-900">FAQs</h3>
          <p className="mt-2 text-gray-700">Find answers to common questions about using the app.</p>
          <button type="button" onClick={() => onNavigate?.('faqs')} className="mt-4 rounded-xl bg-cyan-700 text-white px-4 py-2 font-semibold shadow hover:bg-cyan-600">View FAQs</button>
        </div>

        <div className="rounded-xl bg-white ring-1 ring-black/5 shadow p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-gray-900">Terms of Service</h3>
          <p className="mt-2 text-gray-700">Read the terms that govern use of our services.</p>
          <button type="button" onClick={() => onNavigate?.('termsOfService')} className="mt-4 rounded-xl bg-cyan-700 text-white px-4 py-2 font-semibold shadow hover:bg-cyan-600">View Terms</button>
        </div>

        <div className="rounded-xl bg-white ring-1 ring-black/5 shadow p-6 sm:p-8">
          <h3 className="text-xl font-semibold text-gray-900">Privacy Policy</h3>
          <p className="mt-2 text-gray-700">Understand how we collect and protect your data.</p>
          <button type="button" onClick={() => onNavigate?.('privacyPolicy')} className="mt-4 rounded-xl bg-cyan-700 text-white px-4 py-2 font-semibold shadow hover:bg-cyan-600">View Policy</button>
        </div>
      </div>
    </div>
  )
}