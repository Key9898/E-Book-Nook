// c:\Users\keych\Development\Projects\Personal\E-Book Nook\src\components\TermsOfService\TermsOfService.tsx
import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'

interface TermsOfServiceProps {
  onNavigate?: (page: string) => void
}

export default function TermsOfService({ onNavigate }: TermsOfServiceProps) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('termsOfService')}
        title="The Rules of Our Nook"
        description="By using E-Book Nook, you agree to these terms. This document covers your rights, our responsibilities, user conduct, and our important copyright policy. Please read it carefully."
        buttonText="Read Our Terms"
        backgroundImgAlt="Terms of Service banner"
        preTitleSlot={<Breadcrumb pages={[{ name: 'Terms of Service', href: '#termsOfService', current: true }]} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="terms-of-service-content"
        />
      <main id="terms-of-service-content" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-cyan-700/80 sm:text-5xl">Terms of Service</h2>
            <p className="mt-6 text-lg text-gray-600">Welcome to E-Book Nook. By accessing or using our website, you agree to these Terms.</p>
            <p className="mt-4 text-sm text-gray-500">Last Updated: November 16, 2025</p>

            <div className="mt-12 space-y-10">
              <section>
                <h3 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">By using E-Book Nook, you confirm that you are at least 13 years old and capable of agreeing to these Terms. If you do not agree, please discontinue use.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">2. Use of the Service</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-3">
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Access content for personal, non-commercial use.</li>
                    <li>Respect all applicable laws and third-party rights.</li>
                    <li>Do not attempt to disrupt or interfere with the service.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">3. Accounts & Security</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-2">
                  <p className="text-gray-700">If you create an account, you are responsible for safeguarding your credentials and for all activity under your account.</p>
                  <p className="text-gray-700">Authentication is provided via Firebase. Please refer to our Privacy Policy for details on data handling.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">4. Content & Ownership</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-2">
                  <p className="text-gray-700">All site content, trademarks, and design elements are owned by E-Book Nook or its licensors.</p>
                  <p className="text-gray-700">Public reviews you submit may be displayed publicly. You grant us a license to host and display that content.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">5. Prohibited Conduct</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6 space-y-3">
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Harassing or harmful behavior, hate speech, or illegal activity.</li>
                    <li>Reverse engineering, scraping, or unauthorized data collection.</li>
                    <li>Uploading malware or attempting to bypass security.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">6. Termination</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">We may suspend or terminate access if you violate these Terms or use the service in a way that may harm others or the platform.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">7. Disclaimers</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">The service is provided “as is” without warranties of any kind. Some content may be provided by third parties; we make no guarantees about its accuracy.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">8. Limitation of Liability</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">To the fullest extent permitted by law, E-Book Nook is not liable for indirect, incidental, or consequential damages resulting from your use of the service.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">9. Changes to Terms</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">We may update these Terms from time to time. Updated Terms will be posted on this page.</p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-semibold text-gray-900">10. Contact Us</h3>
                <div className="mt-4 rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-6">
                  <p className="text-gray-700">If you have questions regarding these Terms, please reach out through our Feedbacks page.</p>
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