import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { FaFilePdf } from 'react-icons/fa6'
import { LuFileAudio } from 'react-icons/lu'

const tabs = [
  { name: 'All', href: '#', current: true },
  { name: 'PDF Books', href: '#', current: false },
  { name: 'Audiobooks', href: '#', current: false },
]

type DrawerItem = { id: string; title: string; author: string; type: 'pdf' | 'audio'; url: string }

const pdfBooks: DrawerItem[] = [
  { id: 'pdf1', title: 'Introduction to Computer Science', author: 'Unknown', type: 'pdf', url: '/PdfBooks/introduction_to_computer_science.pdf' },
  { id: 'pdf2', title: 'Reading with COC Formula', author: 'Unknown', type: 'pdf', url: '/PdfBooks/reading_with_coc_%20formula.pdf' },
  { id: 'pdf3', title: 'Introduction to Python', author: 'Unknown', type: 'pdf', url: '/PdfBooks/introduction_to_python_programming.pdf' },
]

const audioFiles = [
  '/Audiobooks/cocoa_break_collection/01_waterbabe.mp3',
  '/Audiobooks/cocoa_break_collection/02_haretortoise.mp3',
  '/Audiobooks/cocoa_break_collection/03_manboydonkey.mp3',
  '/Audiobooks/cocoa_break_collection/04_townmouse.mp3',
  '/Audiobooks/cocoa_break_collection/05_catandsparrows.mp3',
  '/Audiobooks/cocoa_break_collection/06_fishtale.mp3',
  '/Audiobooks/cocoa_break_collection/07_maninmoon.mp3',
  '/Audiobooks/cocoa_break_collection/08_pigs.mp3',
  '/Audiobooks/cocoa_break_collection/09_trueprincess.mp3',
  '/Audiobooks/cocoa_break_collection/10_ladyofmoon.mp3',
  '/Audiobooks/cocoa_break_collection/11_princessfisherman.mp3',
  '/Audiobooks/cocoa_break_collection/12_girlbecamebird.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_01.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_02.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_03.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_04.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_05.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_06.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_07.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_08.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_09.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_10.mp3',
  '/Audiobooks/six_little_girls/sixlittlegirls_11.mp3',
]
const toTitle = (url: string) => (url.split('/').pop() || '').replace(/\.mp3$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
const audioBooks: DrawerItem[] = audioFiles.map((url, idx) => ({ id: `a${idx+1}`, title: toTitle(url), author: 'Unknown', type: 'audio', url }))

const allBooks: DrawerItem[] = [...pdfBooks, ...audioBooks]

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface BooksDrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onNavigate?: (page: string) => void
}

export default function BooksDrawer({ open: openProp, onOpenChange, onNavigate }: BooksDrawerProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp! : internalOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen
  const [activeTab, setActiveTab] = useState<'All' | 'PDF Books' | 'Audiobooks'>('All')
  const visibleBooks = activeTab === 'All' ? allBooks : activeTab === 'PDF Books' ? allBooks.filter((b) => b.type === 'pdf') : allBooks.filter((b) => b.type === 'audio')

  return (
    <div>
      <Dialog open={open} onClose={setOpen} className="relative z-[60]">
        <div className="fixed inset-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10 sm:pr-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:-translate-x-full sm:duration-700"
              >
                <div className="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                  {/* Header Section */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <DialogTitle className="text-xl font-bold text-cyan-700/80">Books Collection</DialogTitle>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="relative rounded-xl text-gray-400 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                        >
                          <span className="absolute -inset-2.5" />
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Section */}
                  <div className="border-b border-gray-200">
                    <div className="px-6">
                      <nav className="-mb-px flex space-x-6">
                        {tabs.map((tab) => (
                          <button
                            key={tab.name}
                            type="button"
                            onClick={() => setActiveTab(tab.name as 'All' | 'PDF Books' | 'Audiobooks')}
                            className={classNames(
                              activeTab === tab.name ? 'border-cyan-600 text-cyan-700/80' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                              'border-b-2 px-1 pb-4 text-base font-medium whitespace-nowrap'
                            )}
                          >
                            {tab.name}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>

                  {/* Book List */}
                  <ul role="list" className="flex-1 divide-y divide-gray-200 overflow-y-auto">
                    {visibleBooks.map((book) => (
                      <li key={book.id}>
                        <div className="group relative flex items-center px-5 py-6">
                          <div className="-m-1 block flex-1 p-1 min-w-0">
                            <div aria-hidden="true" className="absolute inset-0 group-hover:bg-gray-50" />
                            <div className="relative flex min-w-0 flex-1 items-center">
                              <span className="relative inline-block shrink-0">
                                {book.type === 'pdf' ? (
                                  <FaFilePdf aria-hidden className="size-10 text-rose-600" />
                                ) : (
                                  <LuFileAudio aria-hidden className="size-10 text-cyan-600" />
                                )}
                              </span>
                              <div className="ml-4 truncate flex-1 min-w-0"> {/* Added flex-1 and min-w-0 here */}
                                <p className="truncate text-base font-medium text-gray-900">{book.title}</p>
                                <p className="truncate text-base text-gray-500">{book.author}</p>
                              </div>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { 
                              const key = book.type === 'pdf' ? 'launchPdf' : 'launchAudio'
                              try { localStorage.setItem(key, JSON.stringify({ id: book.id, title: book.title, url: book.url })) } catch {}
                              onNavigate?.(book.type === 'pdf' ? 'pdfBooks' : 'audiobooks')
                              setOpen(false)
                            }} 
                            className="ml-2 inline-flex shrink-0 items-center rounded-xl bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-cyan-600 relative z-10"
                          >
                            View Book
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}