'use client'

import { useEffect, useState } from 'react'

type StaffMember = {
  id: string
  name: string
  telegram_id: string | null
}

export default function StaffPage() {
  const [staff, setStaff]     = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [name, setName]       = useState('')
  const [telegram, setTelegram] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/business/staff')
    const data = await res.json()
    setStaff(data.staff ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch('/api/business/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        telegram_id: telegram.replace(/^@/, '').trim() || null,
      }),
    })

    if (res.ok) {
      setName('')
      setTelegram('')
      setSuccess(true)
      await load()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to add staff member')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff member? Their future slots will also be removed.')) return
    setDeleting(id)
    const res = await fetch(`/api/business/staff?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to delete staff member')
    } else {
      await load()
    }
    setDeleting(null)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff</h1>

      {/* Add staff form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Add Staff Member</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              required
              placeholder="e.g. Jamshid Toshmatov"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telegram username <span className="text-gray-400 font-normal">(optional — for booking notifications)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
              <input
                type="text"
                placeholder="username"
                value={telegram}
                onChange={e => setTelegram(e.target.value.replace(/^@/, ''))}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Staff member added!</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add staff member'}
          </button>
        </form>
      </div>

      {/* Staff list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Your Staff</h2>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : staff.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">No staff yet. Add someone above.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {staff.map(s => (
              <li key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  {s.telegram_id && (
                    <p className="text-xs text-gray-500 mt-0.5">@{s.telegram_id}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deleting === s.id}
                  className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  {deleting === s.id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
