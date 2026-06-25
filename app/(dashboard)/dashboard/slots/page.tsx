'use client'

import { useEffect, useState, useCallback } from 'react'

type StaffMember = { id: string; name: string }
type Slot = { id: string; time: string; is_available: boolean }
type StaffSlots = { staff: StaffMember; slots: Slot[] }

const formatTime = (t: string) => {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

const toDateStr = (d: Date) => d.toISOString().split('T')[0]

export default function SlotsPage() {
  const today = toDateStr(new Date())
  const [date, setDate]           = useState(today)
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [rows, setRows]           = useState<StaffSlots[]>([])
  const [loading, setLoading]     = useState(false)
  const [generating, setGenerating] = useState<string | null>(null) // staff_id being generated

  // Load staff once
  useEffect(() => {
    fetch('/api/business')
      .then(r => r.json())
      .then(async d => {
        if (!d.business) return
        const res = await fetch(`/api/staff?business_id=${d.business.id}`)
        const sd  = await res.json()
        setStaffList(sd.staff ?? [])
      })
  }, [])

  // Load slots whenever date or staff changes
  const loadSlots = useCallback(async () => {
    if (!staffList.length) return
    setLoading(true)
    const results = await Promise.all(
      staffList.map(async s => {
        const r = await fetch(`/api/slots/all?staff_id=${s.id}&date=${date}`)
        const d = await r.json()
        return { staff: s, slots: d.slots ?? [] } as StaffSlots
      })
    )
    setRows(results)
    setLoading(false)
  }, [staffList, date])

  useEffect(() => { loadSlots() }, [loadSlots])

  const handleGenerate = async (staffId: string) => {
    setGenerating(staffId)
    try {
      await fetch('/api/slots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, date }),
      })
      await loadSlots()
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slots</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage available appointment slots per staff member.</p>
        </div>
        <input
          type="date"
          value={date}
          min={today}
          onChange={e => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {staffList.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-gray-400 text-sm">No staff members found.</p>
          <p className="text-gray-400 text-xs mt-1">Add staff members first from the Staff page.</p>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, j) => <div key={j} className="h-9 bg-gray-100 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ staff, slots }) => (
            <div key={staff.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-700 font-bold text-sm">{staff.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{staff.name}</p>
                    <p className="text-xs text-gray-500">
                      {slots.length > 0
                        ? `${slots.filter(s => s.is_available).length} available · ${slots.filter(s => !s.is_available).length} booked`
                        : 'No slots for this day'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleGenerate(staff.id)}
                  disabled={generating === staff.id}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {generating === staff.id ? 'Generating…' : '+ Generate slots'}
                </button>
              </div>

              {slots.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No slots yet. Click &quot;Generate slots&quot; to create them from working hours.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slots.map(slot => (
                    <div
                      key={slot.id}
                      className={`px-2 py-2 rounded-xl text-xs font-semibold text-center ${
                        slot.is_available
                          ? 'bg-green-50 border border-green-200 text-green-700'
                          : 'bg-gray-100 border border-gray-200 text-gray-400 line-through'
                      }`}
                    >
                      {formatTime(slot.time)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
