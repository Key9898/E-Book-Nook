import { FaArrowCircleLeft, FaArrowCircleRight } from "react-icons/fa"
import { ImProfile } from "react-icons/im";
import { MdOutlineReviews, MdOutlineLocalActivity, MdOutlineNotificationsActive } from "react-icons/md"
import { BiCommentDetail } from "react-icons/bi";
import { TiInfoLargeOutline } from "react-icons/ti";

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
}
interface AccountSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  displayName: string
  photoUrl?: string | null
  navigation?: NavItem[]
  onNavigate?: (page: string) => void
  notifCount?: number
  activeHref?: string
}

export default function AccountSidebar({
  collapsed,
  onToggleCollapse,
  displayName,
  photoUrl,
  navigation = [
    { name: 'Profile', href: '#', icon: ImProfile, current: true },
    { name: 'My Reviews', href: 'myReviews', icon: MdOutlineReviews },
    { name: 'My Comments', href: 'myComments', icon: BiCommentDetail },
    { name: 'My Activity', href: 'myActivity', icon: MdOutlineLocalActivity },
    { name: 'Notifications', href: 'notifications', icon: MdOutlineNotificationsActive },
    { name: 'Help & Info', href: 'helpAndInfo', icon: TiInfoLargeOutline },
  ],
  onNavigate,
  notifCount = 0,
  activeHref = '#',
}: AccountSidebarProps) {

  const avatarLetter = (displayName || 'U').charAt(0).toUpperCase()
  

  return (
    <>
      <div className="xl:hidden px-1 sm:px-4">
        <div className="mx-4 mt-4 rounded-xl shadow-lg bg-white ring-1 ring-black/5 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {navigation.map((item) => {
              const IconComp = item.icon
              const isActive = item.href === activeHref
              return (
              <button
                key={item.href}
                type="button"
                onClick={() => { onNavigate?.(item.href) }}
                className={`${isActive ? 'bg-gray-100 text-cyan-600' : 'text-gray-700 hover:bg-gray-100 hover:text-cyan-600'} group flex gap-x-3 rounded-xl p-2 text-sm font-semibold w-full text-left`}
              >
                <span className="relative inline-flex">
                  <IconComp className={`${isActive ? 'text-cyan-600' : 'text-gray-400 group-hover:text-cyan-600'} size-6 shrink-0`} />
                  {item.href === 'notifications' && notifCount > 0 && (
                    <span aria-label={`${notifCount} unread`} className="absolute -right-1 -top-1 inline-flex min-w-4 rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                      {Math.min(99, notifCount)}
                    </span>
                  )}
                </span>
                <span>{item.name}</span>
              </button>
            )})}
          </div>
        </div>
      </div>
      <div className="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:flex-col" style={{ width: collapsed ? '6rem' : '18rem' }}>
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 px-6 ring-1 ring-gray-200">
        <div className="flex h-16 shrink-0 items-center justify-between">
          <button type="button" onClick={onToggleCollapse} className="flex items-center gap-2 text-cyan-700">
            {collapsed ? <FaArrowCircleRight className="size-6" /> : <FaArrowCircleLeft className="size-6" />}
            {!collapsed && <span className="font-semibold">Account Settings</span>}
          </button>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const IconComp = item.icon
                  const isActive = item.href === activeHref
                  return (
                  <li key={item.name}>
                    <button
                      type="button"
                      onClick={() => { onNavigate?.(item.href) }}
                      className={`${isActive ? 'bg-gray-100 text-cyan-600' : 'text-gray-700 hover:bg-gray-100 hover:text-cyan-600'} group flex gap-x-3 rounded-xl p-2 text-sm font-semibold w-full text-left`}
                    >
                      <span className="relative inline-flex">
                        <IconComp className={`${isActive ? 'text-cyan-600' : 'text-gray-400 group-hover:text-cyan-600'} size-6 shrink-0`} />
                        {item.href === 'notifications' && notifCount > 0 && (
                          <span aria-label={`${notifCount} unread`} className="absolute -right-1 -top-1 inline-flex min-w-4 rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                            {Math.min(99, notifCount)}
                          </span>
                        )}
                      </span>
                      {!collapsed && <span>{item.name}</span>}
                    </button>
                  </li>
                )})}
              </ul>
            </li>
            <li className="-mx-6 mt-auto">
              <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                {photoUrl ? (
                  <img alt="" src={photoUrl} key={photoUrl} referrerPolicy="no-referrer" className="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5" />
                ) : (
                  <span className="inline-grid place-items-center size-8 rounded-full bg-cyan-100 text-cyan-700 font-bold">{avatarLetter}</span>
                )}
                {!collapsed && <span aria-hidden="true">{displayName}</span>}
              </div>
            </li>
          </ul>
        </nav>
      </div>
      </div>
    </>
  )
}
