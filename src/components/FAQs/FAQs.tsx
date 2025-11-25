import { useState } from 'react'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'

const faqs = [
  {
    question: 'What is E-Book Nook?',
    answer:
      "E-Book Nook is a personal digital library for free PDF books and audiobooks, all in one place. It's a passion project to create a simple, comfortable reading space (a 'nook') for book lovers.",
  },
  {
    question: 'Does E-Book Nook cost money?',
    answer:
      'No. All books, audiobooks, and features on E-Book Nook are 100% free.',
  },
  {
    question: 'Do I need an account just to read or listen?',
    answer:
      'No. You can read books and listen to audiobooks immediately as a Guest without signing up.',
  },
  {
    question: 'So, why should I create an account? (Important)',
    answer:
      'You can use most features like My favoritess List and My Notes as a Guest (saved to your browser). The main benefit of creating an account is sync: when signed in, your favoritess, Notes, and Recently Viewed are saved to Cloud Firestore so you can access them from any device. You also need an account to write public Reviews.',
  },
  {
    question: "What's the difference between Reviews and Feedbacks?",
    answer:
      'Reviews are Public and saved to Cloud Firestore (account required), visible to all users. Feedbacks are Private; the form sends your message directly to the developer via Formspree email and is not stored in our database.',
  },
  {
    question: 'Where is my favoritess List data saved? (Guest vs. User)',
    answer:
      'Guest: data (favoritess, Notes, Recently Viewed, Dark Mode) is saved in your browser Local Storage. Pros: fast, private, persists across restarts. Cons: tied to that specific browser/computer only. Signed-in User: data is saved securely to Cloud Firestore and linked to your account. Pros: synchronized across devices. Cons: requires being online and signed in.',
  },
  {
    question: 'Will my Local Storage data disappear if I restart my computer?',
    answer:
      'No. Local Storage is persistent. It remains until you clear your browser storage or use a different browser (each browser has separate storage).',
  },
  {
    question: 'Is my password safe?',
    answer:
      "Yes. E-Book Nook uses Google's Firebase Authentication. Passwords are encrypted and managed by Google — developers never see your actual password.",
  },
]

interface FAQsProps { onNavigate?: (page: string) => void }

export default function FAQs({ onNavigate }: FAQsProps) {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({})
  return (
    <>
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('faqs')}
        title="Your Questions, Answered"
        description="Discover clear answers to all your questions about our service. Understand exactly how E-Book Nook functions, ranging from our beneficial free features to essential account details, in one convenient location."
        buttonText="Find Answers"
        backgroundImgAlt="FAQs banner"
        preTitleSlot={<Breadcrumb pages={[{ name: 'FAQs', href: '#faqs', current: true }]} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="faqs-content"
        />
      <main id="faqs-content" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-semibold tracking-tight text-cyan-700/80 sm:text-5xl">Frequently asked questions</h2>
            <dl className="mt-16 space-y-6">
              {faqs.map((faq, index) => (
                <>
                  <dt className="pt-6 first:pt-0">
                    <button type="button" onClick={() => setOpenMap((m) => ({ ...m, [index]: !m[index] }))} className="group flex w-full items-start justify-between text-left text-gray-900">
                      <span className="text-base/7 font-semibold">{index + 1}. {faq.question}</span>
                      <span className="ml-6 flex h-7 items-center">
                        {openMap[index] ? (
                          <MinusIcon aria-hidden="true" className="size-6" />
                        ) : (
                          <PlusIcon aria-hidden="true" className="size-6" />
                        )}
                      </span>
                    </button>
                  </dt>
                  <dd className={`mt-2 pr-12 ${openMap[index] ? '' : 'hidden'}`}>
                    <div className="rounded-xl shadow-lg ring-1 ring-black/5 bg-white p-4">
                      <p className="text-base/7 text-gray-600">{faq.answer}</p>
                    </div>
                  </dd>
                </>
              ))}
            </dl>
          </div>
        </div>
      </main>
      <ScrollToTopButton />
      <Footer onNavigate={onNavigate} />
    </>
  )
}