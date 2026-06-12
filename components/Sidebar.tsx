'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard',          label: 'Overview' },
  { href: '/dashboard/bookings', label: 'Bookings' },
  { href: '/dashboard/slots',    label: 'Slots' },
  { href: '/dashboard/services', label: 'Services' },
  { href: '/dashboard/staff',    label: 'Staff' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [slug, setSlug]     = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/business')
      .then(r => r.json())
      .then(d => { if (d.business?.slug) setSlug(d.business.slug) })
  }, [])

  const bookingUrl = slug ? `https://zeggo.uz/book/${slug}` : null

  const handleCopy = () => {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-xl font-extrabold text-indigo-600 tracking-tight">Zeggo</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 space-y-2">
        {/* Booking link */}
        {bookingUrl && (
          <div className="px-3 py-2.5 bg-indigo-50 rounded-lg">
            <p className="text-xs font-semibold text-indigo-600 mb-1">Booking link</p>
            <p className="text-xs text-indigo-500 truncate font-mono mb-2">/book/{slug}</p>
            <button
              onClick={handleCopy}
              className={`w-full py-1.5 rounded-md text-xs font-bold transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
