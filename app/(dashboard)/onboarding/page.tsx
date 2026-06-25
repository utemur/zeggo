'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────
type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

interface DayHours {
  open: boolean
  start: string
  end: string
}

type WorkingHours = Record<DayKey, DayHours>

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

const CATEGORIES = [
  { id: 'barbershop', label: 'Barbershop' },
  { id: 'salon',      label: 'Salon' },
  { id: 'clinic',     label: 'Clinic' },
  { id: 'other',      label: 'Other' },
]

const DEFAULT_HOURS: WorkingHours = {
  mon: { open: true,  start: '09:00', end: '18:00' },
  tue: { open: true,  start: '09:00', end: '18:00' },
  wed: { open: true,  start: '09:00', end: '18:00' },
  thu: { open: true,  start: '09:00', end: '18:00' },
  fri: { open: true,  start: '09:00', end: '18:00' },
  sat: { open: false, start: '09:00', end: '18:00' },
  sun: { open: false, start: '09:00', end: '18:00' },
}

const TOTAL_STEPS = 3

// ── Component ────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')

  // Step 2
  const [hours, setHours] = useState<WorkingHours>(DEFAULT_HOURS)

  // Step 3
  const [staffName, setStaffName] = useState('')
  const [staffTelegram, setStaffTelegram] = useState('')

  // ── Step helpers ─────────────────────────────────────────
  const updateDay = (day: DayKey, field: keyof DayHours, value: boolean | string) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0 && category.length > 0
    if (step === 2) return true
    return true
  }

  const handleNext = () => {
    setError('')
    if (step < TOTAL_STEPS) setStep(s => s + 1)
  }

  const handleFinish = async () => {
    setError('')
    setLoading(true)
    try {
      // 1. Create business
      const bizRes = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category, working_hours: hours }),
      })
      if (!bizRes.ok) {
        const d = await bizRes.json()
        throw new Error(d.error ?? 'Failed to create business')
      }

      // 2. Add first staff member
      if (staffName.trim()) {
        const staffRes = await fetch('/api/business/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: staffName.trim(),
            telegram_id: staffTelegram.replace(/^@/, '').trim() || null,
          }),
        })
        if (!staffRes.ok) {
          const d = await staffRes.json()
          throw new Error(d.error ?? 'Failed to save staff member')
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">Zeggo</span>
          <p className="text-sm text-gray-500 mt-1">Let&apos;s set up your business</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Progress bar */}
          <div className="px-8 pt-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Step {step} of {TOTAL_STEPS}
              </span>
              <span className="text-xs text-gray-400">
                {step === 1 ? 'Business details' : step === 2 ? 'Working hours' : 'Your team'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-8 pb-8">

            {/* ── Step 1: Business details ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Your business</h2>
                  <p className="text-sm text-gray-500 mt-0.5">What should we call your business?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. The Sharp Barber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                          category === cat.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Working hours ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Working hours</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Set your regular opening times. You can change these later.</p>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {DAYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3 px-4 py-3 bg-white">
                      <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{label}</span>

                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <div
                          onClick={() => updateDay(key, 'open', !hours[key].open)}
                          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                            hours[key].open ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            hours[key].open ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className={`text-xs font-medium w-12 ${hours[key].open ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {hours[key].open ? 'Open' : 'Closed'}
                        </span>
                      </label>

                      {hours[key].open ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="time"
                            value={hours[key].start}
                            onChange={e => updateDay(key, 'start', e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <span className="text-gray-400 text-xs">—</span>
                          <input
                            type="time"
                            value={hours[key].end}
                            onChange={e => updateDay(key, 'end', e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      ) : (
                        <span className="ml-auto text-xs text-gray-400">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 3: First staff member ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add your first team member</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Add yourself or a colleague. You can add more staff later.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram username <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                    <input
                      type="text"
                      value={staffTelegram}
                      onChange={e => setStaffTelegram(e.target.value.replace(/^@/, ''))}
                      placeholder="username"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Used to send booking notifications via Telegram bot.</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <span />
              )}

              {step < TOTAL_STEPS ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Continue →
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  {!staffName.trim() && (
                    <button
                      onClick={handleFinish}
                      disabled={loading}
                      className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                    >
                      Skip for now
                    </button>
                  )}
                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Setting up…' : 'Finish Setup'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
