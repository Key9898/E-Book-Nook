import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'
import { FaBookOpenReader } from "react-icons/fa6"
import { auth } from '../../firebaseConfig'

interface FeedbacksProps {
  onNavigate?: (page: string) => void
}

export default function Feedbacks({ onNavigate }: FeedbacksProps) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('feedbacks')}
        title="Your Voice Shapes Our Shared Nook"
        description="E-Book Nook is built for our reading community, and your voice is essential in shaping it. Tell us what you love, what's missing, or any new ideas. Let's build better, together."
        buttonText="Give Feedback"
        backgroundImgAlt="Feedback banner"
        preTitleSlot={<Breadcrumb pages={[{ name: 'Feedbacks', href: '#feedbacks', current: true }]} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="feedbacks-content"
      />
      <div id="feedbacks-content" className="relative isolate bg-white px-4 py-20 sm:px-9 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-xl lg:max-w-4xl">
          <h2 className="text-4xl font-semibold tracking-tight text-pretty text-cyan-700/80 sm:text-5xl">We’d love to hear from you</h2>
          <p className="mt-2 text-lg text-gray-600">Whether it's a bug report, a new feature request, or just a kind word, we read every single message sent our way.</p>
          <div className="mt-8 flex flex-col gap-16 sm:gap-y-20 lg:flex-row">
            <form method="POST" className="lg:flex-auto" onSubmit={async (e) => {
              e.preventDefault()
              if (!auth?.currentUser) {
                window.dispatchEvent(new CustomEvent('app:auth:open'))
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Login required', message: 'Please log in to send feedback.' } }))
                return
              }
              const form = e.currentTarget as HTMLFormElement
              const formData = new FormData(form)
              try {
                const res = await fetch('https://formspree.io/f/xzzyddlr', {
                  method: 'POST',
                  body: formData,
                  headers: { Accept: 'application/json' },
                })
                if (res.ok) {
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'success', title: 'Feedback sent', message: 'Thanks for helping improve E-Book Nook.' } }))
                  form.reset()
                } else {
                  window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Failed to send', message: 'Please try again later.' } }))
                }
              } catch {
                window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'error', title: 'Network error', message: 'Check your connection and try again.' } }))
              }
            }}>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="full-name" className="block text-sm/6 font-semibold text-gray-900">Full name</label>
                  <div className="mt-2.5">
                    <input
                      id="full-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 backdrop-blur-sm placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600"
                      required
                      defaultValue={(auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || '')}
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm/6 font-semibold text-gray-900">Email address</label>
                  <div className="mt-2.5">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="your.email@example.com"
                      className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 backdrop-blur-sm placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600"
                      required
                      defaultValue={(auth?.currentUser?.email || '')}
                      readOnly
                      aria-readonly="true"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-sm/6 font-semibold text-gray-900">Message</label>
                  <div className="mt-2.5">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="Tell us what you enjoy, what’s missing, or any bugs in E-Book Nook."
                      className="block w-full rounded-xl bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 backdrop-blur-sm placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600"
                      defaultValue={''}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <button
                  type="submit"
                  className="block w-full rounded-xl bg-cyan-700/80 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-lg hover:bg-cyan-600/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                >
                  Send Feedback
                </button>
              </div>
              <p className="mt-4 text-sm/6 text-gray-500">
                By submitting this form, I agree to the{' '}
                <button
                 type="button"
                 onClick={() => onNavigate?.('privacyPolicy')}
                 className="font-semibold whitespace-nowrap text-cyan-600">
                 privacy policy
                </button>.
              </p>
            </form>
            <div className="lg:mt-9 lg:w-80 lg:flex-none">
              <div className="flex items-center gap-2 text-cyan-600">
                <FaBookOpenReader aria-hidden className="size-8" />
                <span className="text-xl font-semibold">Our Commitment</span>
              </div>
              <figure className="mt-10">
                <blockquote className="text-xl font-semibold text-gray-900">
                  <p>“We are committed to building a simple, accessible, and comfortable reading space for everyone. Your feedback is the most valuable part of our process.”</p>
                </blockquote>
                <figcaption className="mt-10 flex gap-x-6">
                  <img alt="" src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60" className="size-12 flex-none rounded-full bg-gray-50" />
                  <div>
                    <div className="text-base font-semibold text-gray-900">Key</div>
                    <div className="text-sm/6 text-gray-600">Founder and builder of E-Book Nook</div>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTopButton />
      <Footer onNavigate={onNavigate} />
    </>
  )
}