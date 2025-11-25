import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'
import { MdFavoriteBorder, MdOutlineDarkMode } from "react-icons/md"
import { FaEdit, FaHistory } from "react-icons/fa"
import { FaFilePdf } from "react-icons/fa6"
import { LuFileAudio } from "react-icons/lu"

const features = [
  {
    name: 'My favorites List',
    description:
      'Organize your favorites books or titles you want to read later, all in one list. Your list is saved securely right in your browser.',
    icon: MdFavoriteBorder,
  },
  {
    name: 'Quick Notes',
    description:
      'While reading or listening, easily open the note drawer to jot down new ideas or important points without leaving the page.',
    icon: FaEdit,
  },
  {
    name: 'Recently Viewed',
    description:
      'Easily jump back to the last book you were reading. Your viewing history is saved locally in your browser for quick access.',
    icon: FaHistory,
  },
  {
    name: 'Reading Mode',
    description:
      'Switch between Light Mode and Dark Mode to focus longer and reduce eye strain, day or night.',
    icon: MdOutlineDarkMode,
  },
]

interface CollectionsProps {
    onNavigate?: (page: string) => void
}

export default function Collections({ onNavigate }: CollectionsProps) {
  const breadcrumbPages = [
        { name: 'Collections', href: '#collections', current: true }
    ]
  return (
    <>
      <Header onNavigate={onNavigate} /> 
        <HeroBanner 
          onPrimaryAction={() => onNavigate?.('collections')} 
          title="Discover a Deeper Reading Experience"
          description="E-Book Nook is more than just a library. It's a space designed with powerful tools to help you track your progress, capture ideas, and read comfortably. See what makes your nook special."
          buttonText="Explore Features"
          backgroundImgAlt="Mountain lake village"
          backgroundImgClass="bg-[url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop')]"
          variant="collections"
          preTitleSlot={<Breadcrumb pages={breadcrumbPages} onNavigate={onNavigate} variant="dark" />}
          scrollTargetId="collections-content"
        />
      <main id="collections-content" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-16 sm:mx-0 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-5">
            <div className="col-span-2">
              <h2 className="text-4xl font-semibold tracking-tight text-pretty text-cyan-700/90 sm:text-5xl">
                Built for Readers, Tailored for You
              </h2>
              <p className="mt-6 text-lg text-pretty text-gray-600">
                E-Book Nook is more than just a library. It's a space designed with powerful tools to help you track your progress, capture ideas, and read comfortably. See what makes your nook special.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate?.('pdfBooks')}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-cyan-600"
                >
                  <FaFilePdf aria-hidden className="size-5" />
                  PDF Books
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.('audiobooks')}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-cyan-700"
                >
                  <LuFileAudio aria-hidden className="size-5" />
                  Audiobooks
                </button>
              </div>
            </div>
            <dl className="col-span-3 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.name}>
                  <dt className="text-lg font-semibold text-cyan-800/80">
                    <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-cyan-600">
                      <feature.icon aria-hidden="true" className="size-10 text-white" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 text-base text-gray-600">{feature.description}</dd>
                </div>
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
