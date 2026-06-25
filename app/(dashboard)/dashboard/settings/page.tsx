'use client'

import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [name, setName]               = useState('')
  const [chatId, setChatId]           = useState('')
  const [slug, setSlug]               = useState('')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState(false)

  const bookingUrl = slug ? `https://zeggo.uz/book/${slug}` : ''

  useEffect(() => {
    fetch('/api/business')
      .then(r => r.json())
      .then(d => {
        if (d.business) {
          setName(d.business.name ?? '')
          setChatId(d.business.telegram_chat_id ?? '')
          setSlug(d.business.slug ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(false); setSaving(true)
    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), telegram_chat_id: chatId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="space-y-4 max-w-lg">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your business profile and integrations.</p>

      {/* Public booking link */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-8">
        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">Your Public Booking Link</p>
        <p className="text-xs text-indigo-600 mb-3">Share this link with your clients to let them book appointments.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-900 font-mono truncate">
            {bookingUrl || 'Complete setup to get your link'}
          </code>
          {bookingUrl && (
            <button
              onClick={handleCopy}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Settings form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Telegram Chat ID
            <span className="ml-2 text-xs font-normal text-gray-400">(for booking notifications)</span>
          </label>
          <input
            type="text"
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            placeholder="e.g. 123456789"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Message <span className="font-mono">@userinfobot</span> on Telegram to get your chat ID.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Settings saved successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
