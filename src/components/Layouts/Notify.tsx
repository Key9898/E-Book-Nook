import { useEffect, useState } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/20/solid'

export default function Notification() {
  const [show, setShow] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ title?: string; message?: string; type?: 'success' | 'error' }>).detail || {}
      setTitle(detail.title ?? (detail.type === 'error' ? 'Action failed' : 'Success'))
      setMessage(detail.message ?? '')
      setType(detail.type ?? 'success')
      setShow(true)
      window.clearTimeout((window as any).__notifyTimer)
      ;(window as any).__notifyTimer = window.setTimeout(() => setShow(false), 4000)
    }
    window.addEventListener('app:notify', handler as EventListener)
    return () => window.removeEventListener('app:notify', handler as EventListener)
  }, [])

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 z-[1000] flex items-end px-4 py-6 sm:items-start sm:p-6"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition show={show}>
            <div className="pointer-events-auto w-full max-w-sm rounded-xl bg-white shadow-lg outline-1 outline-black/5 transition data-closed:opacity-0 data-enter:transform data-enter:duration-300 data-enter:ease-out data-closed:data-enter:translate-y-2 data-leave:duration-100 data-leave:ease-in data-closed:data-enter:sm:translate-x-2 data-closed:data-enter:sm:translate-y-0">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    {type === 'success' ? (
                      <CheckCircleIcon aria-hidden="true" className="size-6 text-green-500" />
                    ) : (
                      <XMarkIcon aria-hidden="true" className="size-6 text-red-500" />
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">{title}</p>
                    {message ? <p className="mt-1 text-sm text-gray-500">{message}</p> : null}
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShow(false)
                      }}
                      className="inline-flex rounded-xl text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-cyan-600"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
}