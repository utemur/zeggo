'use client'

import { useEffect, useState } from 'react'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const [name, setName]               = useState('')
  const [duration, setDuration]       = useState('')
  const [price, setPrice]             = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/services')
    const data = await res.json()
    setServices(data.services ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        duration_minutes: parseInt(duration),
        price: parseInt(price),
      }),
    })

    if (res.ok) {
      setName('')
      setDuration('')
      setPrice('')
      setSuccess(true)
      await load()
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to add service')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  const formatSum = (n: number) => n.toLocaleString('ru-RU') + " so'm"

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Services</h1>

      {/* Add service form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Add Service</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service name</label>
            <input
              type="text"
              required
              placeholder="e.g. Haircut"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                required
                min="5"
                max="480"
                placeholder="30"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (so&apos;m)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="50000"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Service added!</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add service'}
          </button>
        </form>
      </div>

      {/* Services list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Your Services</h2>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : services.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">No services yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {services.map(s => (
              <li key={s.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.duration_minutes} min · {formatSum(s.price)}</p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
