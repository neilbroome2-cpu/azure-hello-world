'use client'

import { useState } from 'react'

type Submission = {
  id: string
  submitted_at: string
  patient_name: string
  patient_dob: string
  patient_email: string
  patient_chi: string
  pathway: string
  prefer_gp_appointment: boolean
  needs_gp_first: boolean
  ipss_total: number | null
  ipss_severity: string | null
  on_finasteride: boolean
  on_dutasteride: boolean
  family_history: string
  reason: string
  active_uti: string
  bone_pain: string
}

function calcAge(dob: string) {
  if (!dob) return '—'
  const today = new Date(), b = new Date(dob)
  let age = today.getFullYear() - b.getFullYear()
  if (today.getMonth() - b.getMonth() < 0 || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--
  return age
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Badge({ label, colour }: { label: string; colour: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colour}`}>{label}</span>
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Submission | null>(null)

  async function login() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/submissions', {
        headers: { 'x-admin-password': password },
      })
      if (res.status === 401) { setError('Incorrect password.'); setLoading(false); return }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubmissions(data)
      setAuthed(true)
    } catch {
      setError('Could not connect to the database. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#005EB8] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Admin — PSA Submissions</h1>
          <p className="text-sm text-gray-500 mb-6">Oakley Medical Practice</p>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
            placeholder="Enter admin password"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            onClick={login}
            disabled={loading || !password}
            className="w-full bg-[#005EB8] hover:bg-[#004a93] disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#005EB8] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">PSA Consent Submissions</h1>
          <p className="text-blue-200 text-xs">Oakley Medical Practice — {submissions.length} record{submissions.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setAuthed(false); setPassword('') }} className="text-blue-200 text-sm hover:text-white">Sign out</button>
      </div>

      {selected ? (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={() => setSelected(null)} className="text-[#005EB8] text-sm font-medium mb-4 hover:underline">← Back to list</button>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-[#005EB8] px-6 py-4">
              <h2 className="text-white font-bold text-lg">{selected.patient_name}</h2>
              <p className="text-blue-200 text-xs mt-1">Submitted {formatDate(selected.submitted_at)} · Ref: {selected.id}</p>
            </div>
            <div className="px-6 py-5 space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Date of Birth</p>
                  <p className="text-sm text-gray-900">{selected.patient_dob} (Age {calcAge(selected.patient_dob)})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm text-gray-900">{selected.patient_email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">CHI Number</p>
                  <p className="text-sm text-gray-900">{selected.patient_chi || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Pathway</p>
                  <p className="text-sm text-gray-900 capitalize">{selected.pathway || '—'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Flags</p>
                <div className="flex flex-wrap gap-2">
                  {selected.prefer_gp_appointment && <Badge label="Wants GP appointment first" colour="bg-blue-100 text-blue-800" />}
                  {selected.needs_gp_first && <Badge label="Needs GP review (mobility)" colour="bg-amber-100 text-amber-800" />}
                  {selected.on_finasteride && <Badge label="On Finasteride" colour="bg-orange-100 text-orange-800" />}
                  {selected.on_dutasteride && <Badge label="On Dutasteride" colour="bg-orange-100 text-orange-800" />}
                  {selected.active_uti === 'yes' && <Badge label="Active UTI" colour="bg-red-100 text-red-800" />}
                  {selected.bone_pain === 'yes' && <Badge label="Bone pain" colour="bg-red-100 text-red-800" />}
                  {(selected.family_history === 'Yes — father or brother' || selected.family_history === 'Yes — other relative') && (
                    <Badge label={`FH: ${selected.family_history}`} colour="bg-purple-100 text-purple-800" />
                  )}
                  {!selected.prefer_gp_appointment && !selected.needs_gp_first && !selected.on_finasteride && !selected.on_dutasteride && selected.active_uti !== 'yes' && selected.bone_pain !== 'yes' && (
                    <Badge label="No flags" colour="bg-green-100 text-green-800" />
                  )}
                </div>
              </div>

              {selected.ipss_total !== null && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">IPSS Score</p>
                  <p className="text-sm text-gray-900">{selected.ipss_total}/35 — {selected.ipss_severity}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Reason for requesting test</p>
                <p className="text-sm text-gray-900">{selected.reason || '—'}</p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Family history</p>
                <p className="text-sm text-gray-900">{selected.family_history || '—'}</p>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-500">No submissions yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Age</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Submitted</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Pathway</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map(s => (
                    <tr key={s.id} onClick={() => setSelected(s)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.patient_name}</td>
                      <td className="px-4 py-3 text-gray-600">{calcAge(s.patient_dob)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(s.submitted_at)}</td>
                      <td className="px-4 py-3 text-gray-700 capitalize">{s.pathway || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.prefer_gp_appointment && <Badge label="GP appt" colour="bg-blue-100 text-blue-700" />}
                          {s.needs_gp_first && <Badge label="Mobility" colour="bg-amber-100 text-amber-700" />}
                          {(s.on_finasteride || s.on_dutasteride) && <Badge label="5-ARI" colour="bg-orange-100 text-orange-700" />}
                          {s.active_uti === 'yes' && <Badge label="UTI" colour="bg-red-100 text-red-700" />}
                          {s.bone_pain === 'yes' && <Badge label="Bone pain" colour="bg-red-100 text-red-700" />}
                          {!s.prefer_gp_appointment && !s.needs_gp_first && !s.on_finasteride && !s.on_dutasteride && s.active_uti !== 'yes' && s.bone_pain !== 'yes' && (
                            <Badge label="Clear" colour="bg-green-100 text-green-700" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
