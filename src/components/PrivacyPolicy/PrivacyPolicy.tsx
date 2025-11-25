import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'

interface PrivacyPolicyProps {
  onNavigate?: (page: string) => void
}

export default function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('privacyPolicy')}
        title="How We Protect Your Data"
        description="We prioritize transparency in protecting you. This policy explains the minimal data we collect, how it supports our service, and how you stay in complete control of your personal information."
        buttonText="Understand Your Rights"
        backgroundImgAlt="Privacy Policy banner"
        preTitleSlot={<Breadcrumb pages={[{ name: 'Privacy Policy', href: '#privacyPolicy', current: true }]} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="privacy-policy-content"
        />
      <main id="privacy-policy-content" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-8">
          <div className="mx-auto max-w-4xl">         
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-cyan-700/80 sm:text-5xl">Privacy Policy</h2>
            <p className="mt-6 text-lg text-gray-600">Welcome to E-Book Nook. Your privacy is critically important to us. This policy explains what information we collect, how we use it, and what your rights are.</p>
            <p className="mt-4 text-sm text-gray-500">Last Updated: November 16, 2025</p>

            <div className="mt-12 space-y-10">
              <section>
                <h3 className="text-2xl font-semibold text-gray-900">1. The Information We Collect</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-4">
                  <p className="text-gray-700">As a Guest (Not Signed In): We do not collect any personal information. Features like My favoritess List, My Notes, and Recently Viewed are saved directly to your browser's Local Storage. This data is stored only on your device.</p>
                  <p className="text-gray-700">As a Signed-In User (Account): When you create an account, we use Firebase Authentication (by Google) to securely store your Email Address and an encrypted version of your Password. To synchronize your data, we securely save your My favoritess List, My Notes, and Recently Viewed history in our Cloud Firestore database, linked to your account.</p>
                  <p className="text-gray-700">When You Write Public Reviews: We collect and store the Review Text and your User Name/Email in Cloud Firestore. This information is publicly visible.</p>
                  <p className="text-gray-700">When You Send Private Feedback: Using the "Feedbacks" form, your Name, Email, and Message are sent directly to our developer's email via Formspree. This information is private and not stored in our database.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">2. How We Use Your Information</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-3">
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>To provide and maintain the service (e.g., syncing your favoritess list across devices).</li>
                    <li>To allow you to log in and secure your account.</li>
                    <li>To display your Reviews publicly to the community.</li>
                    <li>To respond to your private questions and feedback (from the Feedbacks form).</li>
                  </ul>
                  <p className="text-gray-700">We will never sell, rent, or share your personal information with third-party advertisers.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">3. Third-Party Services</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-2">
                  <p className="text-gray-700">Firebase (by Google): Handles Authentication and Database (Cloud Firestore).</p>
                  <p className="text-gray-700">Formspree: Handles private Feedback form submissions.</p>
                  <p className="text-gray-700">These services have their own privacy policies and are responsible for how they handle data.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">4. Your Control Over Your Data</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-2">
                  <p className="text-gray-700">Guest Data (Local Storage): You can clear this data at any time by clearing your browser's cache or local storage.</p>
                  <p className="text-gray-700">User Data (Cloud): You may request deletion of your account and associated data (favoritess, Notes, Reviews) at any time.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">5. Changes to This Policy</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">We may update this policy occasionally. We will notify you of any changes by posting the new policy on this page.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">6. Contact Us</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">If you have any questions about this Privacy Policy, please contact us through our Feedbacks page.</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <ScrollToTopButton />
      <Footer onNavigate={onNavigate} />
    </>
  )
}