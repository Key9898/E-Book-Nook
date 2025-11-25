import Header from '../Layouts/Header'
import Footer from '../Layouts/Footer'
import ScrollToTopButton from '../Layouts/ScrollUpToTopButton'
import HeroBanner from '../Layouts/HeroBanner'
import Breadcrumb from '../Layouts/Breadcrumb'
import { FaRegLightbulb } from "react-icons/fa"
import CountUp from 'react-countup'

const stats = [
  { label: 'Formats', value: '2' },
  { label: 'Access', value: 'Free' },
  { label: 'Goals', value: '300+' },
  { label: 'Built For', value: 'Community' },
]

interface OurStoryProps {
  onNavigate?: (page: string) => void
}

export default function OurStory({ onNavigate }: OurStoryProps) {
  return (
    <>
      <Header onNavigate={onNavigate} />
      <HeroBanner
        onPrimaryAction={() => onNavigate?.('ourStory')}
        title="A Quiet Nook Born from Passion"
        description="This Nook began with a simple spark: a passion to build a single, welcoming space where any reader could easily find their next great story, always free from digital clutter."
        buttonText="Explore Our Journey"
        backgroundImgAlt="Our Story banner"
        preTitleSlot={<Breadcrumb pages={[{ name: 'Our Story', href: '#ourStory', current: true }]} onNavigate={onNavigate} variant="dark" />}
        scrollTargetId="ourStory-content"
      />
      <div id="ourStory-content" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-9 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 items-start gap-x-8 gap-y-16 sm:gap-y-24 sm:mx-0 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div className="lg:pr-4">
              <div className="relative overflow-hidden rounded-xl bg-gray-900 px-6 pt-64 pb-9 shadow-2xl sm:px-12 lg:max-w-lg lg:px-8 lg:pb-8 xl:px-10 xl:pb-10">
                <img
                  alt="Team retreat at the lake"
                  src="https://images.unsplash.com/photo-1630569267625-157f8f9d1a7e?q=80&w=2669&auto=format&fit=crop"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="absolute inset-0 size-full rounded-xl object-cover brightness-125 saturate-0"
                />
                <div className="absolute inset-0 bg-cyan-950/80 mix-blend-multiply" />
                <figure className="relative isolate">
                  <div className="mb-2 flex items-center gap-3">
                    <FaRegLightbulb aria-hidden className="size-7 sm:size-8 text-white" />
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">The Spark</h3>
                  </div>
                  <blockquote className="mt-6 text-xl/8 font-semibold text-white">
                    <p>
                      "I was tired of searching for books all over the internet. I just wanted one single place—a quiet 'nook'—where I could gather all my favorites reads, whether PDF or audio. E-Book Nook is that place, built to share with fellow readers."
                    </p>
                  </blockquote>
                  <figcaption className="mt-6 text-base text-gray-300">
                    <strong className="font-semibold text-white">Key,</strong> Founder and developer of E-Book Nook
                  </figcaption>
                </figure>
              </div>
            </div>
            <div>
              <div className="text-xl text-gray-700 lg:max-w-lg">
                <p className="text-base font-semibold text-cyan-600">Our Mission</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-cyan-700/80 sm:text-5xl">
                  A Perfect Nook for Every Reader
                </h1>
                <div className="max-w-xl">
                  <p className="mt-6">
                    Our goal is simple: to create the best possible reading experience. E-Book Nook was born from a love of reading and a desire to make great stories easily accessible.
                  </p>
                  <p className="mt-8">
                    We believe finding a good book shouldn't be a chore. That's why we focus on building a clean, comfortable, and organized space where you can immerse yourself in what truly matters—the story.
                  </p>
                </div>
              </div>
              <dl className="mt-10 grid grid-cols-2 gap-8 border-t border-gray-900/10 pt-10 sm:grid-cols-4">
                {stats.map((stat, statIdx) => {
                  const isNumeric = /^\d+\+?$/.test(stat.value)
                  const hasPlus = stat.value.endsWith('+')
                  const numericValue = isNumeric ? parseInt(stat.value, 10) : null
                  return (
                    <div key={statIdx}>
                      <dt className="text-lg font-semibold text-cyan-600">{stat.label}</dt>
                      <dd className={isNumeric ? "mt-2 text-2xl font-bold tracking-tight text-cyan-700" : "inline-flex animate-bounce mt-2 text-xl font-bold tracking-tight text-cyan-700"}>
                        {isNumeric && numericValue !== null ? (
                          <CountUp end={numericValue} duration={3} suffix={hasPlus ? '+' : undefined} enableScrollSpy scrollSpyOnce />
                        ) : (
                          stat.value
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTopButton />
      <Footer onNavigate={onNavigate} />
    </>
  )
}