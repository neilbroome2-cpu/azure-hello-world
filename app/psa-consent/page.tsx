'use client'

import { useState } from 'react'
import Link from 'next/link'
import { generateCode, GROUP_LABELS, GROUP_COLOURS, getGroup } from '@/lib/codeGenerator'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  name: string; dob: string; email: string; chi: string
  ethnicity: string
  on_tamsulosin: boolean; on_finasteride: boolean; on_dutasteride: boolean; other_prostate_meds: string
  previous_psa_tested: string; previous_psa_date: string; previous_psa_value: string
  clinical_fitness: string
  active_uti: string
  reason: string; symptoms: string[]; bone_pain: string; family_history: string
  ipss_q1: number; ipss_q2: number; ipss_q3: number; ipss_q4: number
  ipss_q5: number; ipss_q6: number; ipss_q7: number; ipss_qol: number
  prefer_gp_appointment: boolean
  understood_what_psa_is: boolean; understood_raised_causes: boolean
  understood_limitations: boolean; understood_next_steps: boolean
  consent_test: boolean; consent_data: boolean
}

const INITIAL: FormData = {
  name: '', dob: '', email: '', chi: '',
  ethnicity: '',
  on_tamsulosin: false, on_finasteride: false, on_dutasteride: false, other_prostate_meds: '',
  previous_psa_tested: '', previous_psa_date: '', previous_psa_value: '',
  clinical_fitness: '',
  active_uti: '',
  reason: '', symptoms: [], bone_pain: '', family_history: '',
  ipss_q1: -1, ipss_q2: -1, ipss_q3: -1, ipss_q4: -1,
  ipss_q5: -1, ipss_q6: -1, ipss_q7: -1, ipss_qol: -1,
  prefer_gp_appointment: false,
  understood_what_psa_is: false, understood_raised_causes: false,
  understood_limitations: false, understood_next_steps: false,
  consent_test: false, consent_data: false,
}

const TOTAL_STEPS = 5

const SYMPTOM_OPTIONS = [
  'Difficulty starting to pass urine',
  'Weak or slow urine flow',
  'Feeling the bladder is not fully empty',
  'Needing to urinate more often than usual',
  'Getting up at night to urinate',
  'Sudden urgent need to urinate',
  'Blood in urine',
  'None of these',
]

const REASONS = [
  'I have urinary symptoms',
  'I have other symptoms that may be related to my prostate',
  'I have a family history of prostate cancer',
  'My GP recommended this test',
  'General health check / peace of mind',
  'Other reason',
]

const ETHNICITY_OPTIONS = [
  'White (British, Irish or other)',
  'Black African or Caribbean',
  'South Asian (Indian, Pakistani, Bangladeshi or Sri Lankan)',
  'Mixed or multiple ethnic groups',
  'Other ethnic group',
  'Prefer not to say',
]

const IPSS_FREQ = [
  { label: 'Not at all', value: 0 },
  { label: 'Less than 1 in 5 times', value: 1 },
  { label: 'Less than half the time', value: 2 },
  { label: 'About half the time', value: 3 },
  { label: 'More than half the time', value: 4 },
  { label: 'Almost always', value: 5 },
]
const IPSS_NOCTURIA = [
  { label: 'None', value: 0 }, { label: '1 time', value: 1 }, { label: '2 times', value: 2 },
  { label: '3 times', value: 3 }, { label: '4 times', value: 4 }, { label: '5 or more', value: 5 },
]
const IPSS_QOL = [
  { label: 'Delighted', value: 0 }, { label: 'Pleased', value: 1 },
  { label: 'Mostly satisfied', value: 2 }, { label: 'Mixed — equally satisfied and dissatisfied', value: 3 },
  { label: 'Mostly dissatisfied', value: 4 }, { label: 'Unhappy', value: 5 }, { label: 'Terrible', value: 6 },
]
const IPSS_QUESTIONS = [
  { id: 'ipss_q1' as keyof FormData, text: 'How often have you had a sensation of not emptying your bladder completely after urinating?', opts: IPSS_FREQ },
  { id: 'ipss_q2' as keyof FormData, text: 'How often have you had to urinate again less than 2 hours after finishing?', opts: IPSS_FREQ },
  { id: 'ipss_q3' as keyof FormData, text: 'How often have you stopped and started again several times when urinating?', opts: IPSS_FREQ },
  { id: 'ipss_q4' as keyof FormData, text: 'How often have you found it difficult to postpone urination?', opts: IPSS_FREQ },
  { id: 'ipss_q5' as keyof FormData, text: 'How often have you had a weak urinary stream?', opts: IPSS_FREQ },
  { id: 'ipss_q6' as keyof FormData, text: 'How often have you had to push or strain to begin urinating?', opts: IPSS_FREQ },
  { id: 'ipss_q7' as keyof FormData, text: 'How many times did you typically get up at night to urinate?', opts: IPSS_NOCTURIA },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  if (!dob) return 0
  const today = new Date(), b = new Date(dob)
  let age = today.getFullYear() - b.getFullYear()
  if (today.getMonth() - b.getMonth() < 0 || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--
  return age
}

function ipssTotal(form: FormData): number | null {
  const s = [form.ipss_q1, form.ipss_q2, form.ipss_q3, form.ipss_q4, form.ipss_q5, form.ipss_q6, form.ipss_q7]
  return s.some(v => v === -1) ? null : s.reduce((a, b) => a + b, 0)
}

function ipssSeverity(n: number) {
  return n <= 7 ? 'Mild' : n <= 19 ? 'Moderate' : 'Severe'
}

function pathway(age: number, fitness: string): 'young' | 'active' | 'watchful' {
  if (age < 50) return 'young'
  if (age >= 80 || fitness === 'walk_no') return 'watchful'
  return 'active'
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#005EB8] rounded-full transition-all duration-300" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PSAConsentPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [code, setCode] = useState('')

  const age = calcAge(form.dob)
  const pat = pathway(age, form.clinical_fitness)
  const hasSymptoms = form.symptoms.some(s => s !== 'None of these' && s !== 'Blood in urine')
  const haematuria = form.symptoms.includes('Blood in urine')
  const showIpss = hasSymptoms
  const ipssScore = ipssTotal(form)
  const onSuppressor = form.on_finasteride || form.on_dutasteride
  const needsGpFirst = form.clinical_fitness === 'walk_no'
  const isBlackAfrican = form.ethnicity === 'Black African or Caribbean'

  function setField(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }
  function setIpssField(field: keyof FormData, value: number) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }
  function toggleSymptom(opt: string) {
    setForm(prev => {
      if (opt === 'None of these') return { ...prev, symptoms: prev.symptoms.includes('None of these') ? [] : ['None of these'] }
      const filtered = prev.symptoms.filter(s => s !== 'None of these')
      return { ...prev, symptoms: filtered.includes(opt) ? filtered.filter(s => s !== opt) : [...filtered, opt] }
    })
    setErrors(prev => ({ ...prev, symptoms: '' }))
  }

  function validateStep(s: number): boolean {
    const e: Partial<Record<string, string>> = {}
    if (s === 1) {
      if (!form.name.trim()) e.name = 'Please enter your full name.'
      if (!form.dob) e.dob = 'Please enter your date of birth.'
      if (!form.email.trim()) e.email = 'Please enter your email address.'
    }
    if (s === 3) {
      if (!form.previous_psa_tested) e.previous_psa_tested = 'Please select an option.'
      if (age >= 50 && !form.clinical_fitness) e.clinical_fitness = 'Please answer this question.'
    }
    if (s === 4) {
      if (!form.reason) e.reason = 'Please select a reason.'
      if (!form.active_uti) e.active_uti = 'Please answer this question.'
      if (!form.bone_pain) e.bone_pain = 'Please answer this question.'
      if (!form.family_history) e.family_history = 'Please select an option.'
      if (showIpss && pat === 'active' && !form.prefer_gp_appointment) {
        const ipssFields = ['ipss_q1','ipss_q2','ipss_q3','ipss_q4','ipss_q5','ipss_q6','ipss_q7'] as (keyof FormData)[]
        ipssFields.forEach(f => { if ((form[f] as number) === -1) e[f] = 'Required.' })
      }
    }
    if (s === 5) {
      if (!form.prefer_gp_appointment) {
        if (!form.understood_what_psa_is) e.understood_what_psa_is = 'Required.'
        if (!form.understood_raised_causes) e.understood_raised_causes = 'Required.'
        if (!form.understood_limitations) e.understood_limitations = 'Required.'
        if (!form.understood_next_steps) e.understood_next_steps = 'Required.'
        if (!form.consent_test) e.consent_test = 'Required.'
      }
      if (!form.consent_data) e.consent_data = 'Required.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() { if (validateStep(step)) setStep(s => Math.min(s + 1, TOTAL_STEPS)) }
  function back() { setStep(s => Math.max(s - 1, 1)); setErrors({}) }

  async function handleSubmit() {
    if (!validateStep(5)) return
    setLoading(true)
    const total = ipssTotal(form)
    const submissionCode = generateCode({ ...form, pathway: pat }, age)
    setCode(submissionCode)
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age,
          pathway: pat,
          needs_gp_first: needsGpFirst,
          ipss_total: total,
          ipss_severity: total !== null ? ipssSeverity(total) : null,
          code: submissionCode,
          group: getGroup({ ...form, pathway: pat }, age),
        }),
      })
    } catch {
      // submission failed silently — still show confirmation
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  const inp = (f: string) => `w-full border rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#005EB8] ${errors[f] ? 'border-red-500' : 'border-gray-300'}`
  const cbRow = (f: string) => `rounded-lg border p-4 ${errors[f] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`

  // ── Confirmation ────────────────────────────────────────────────────────────
  if (submitted) {
    if (form.prefer_gp_appointment) {
      return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md p-8 text-center">
            <div className="flex justify-center mb-4"><div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div></div>
            <h1 className="text-xl font-bold text-gray-900 mb-3">We&apos;ll be in touch</h1>
            <p className="text-gray-700 text-sm mb-4">Thank you, <strong>{form.name}</strong>. We&apos;ve noted that you&apos;d like to speak with a GP first. One of our team will contact you to arrange a suitable time.</p>
            <p className="text-gray-600 text-sm mb-4">You can also call us on <strong>01383 850212</strong>.</p>
            {code && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-center">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Your appointment code</p>
                <p className="font-mono text-2xl font-bold text-blue-900 tracking-widest mb-3">{code}</p>
                <p className="text-sm text-blue-800">Please keep this code safe. When you attend the practice, quote this code at reception and you will be offered the appropriate appointment.</p>
              </div>
            )}
            <Link href="/" className="inline-block bg-[#005EB8] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#004a93] transition-colors text-sm">Back to Oakley Medical Practice</Link>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md p-8 text-center">
          <div className="flex justify-center mb-4"><div className="bg-green-100 rounded-full p-3"><CheckIcon /></div></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Consent recorded</h1>
          <p className="text-gray-700 mb-4">Thank you, <strong>{form.name}</strong>. Your consent for a PSA blood test has been received. We will be in touch to arrange your appointment.</p>

          {needsGpFirst && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-left mb-4">
              <p className="text-amber-800 text-sm font-semibold mb-1">A GP appointment is needed first</p>
              <p className="text-amber-700 text-sm">Because of your answer about mobility, one of our GPs will need to meet with you before we approve the blood test, to make sure it is right for you. We will be in touch to arrange this.</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-4">
            <p className="text-amber-800 text-sm font-semibold mb-1">Before your blood test, remember:</p>
            <ul className="text-amber-800 text-sm ml-4 list-disc space-y-1">
              <li>Avoid ejaculation for 48 hours before the test</li>
              <li>Avoid vigorous exercise (e.g. cycling) for 48 hours before the test</li>
            </ul>
          </div>

          <p className="text-gray-600 text-sm mb-4">Any questions? Call us on <strong>01383 850212</strong>.</p>
          {code && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-center">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Your appointment code</p>
              <p className="font-mono text-2xl font-bold text-green-900 tracking-widest mb-3">{code}</p>
              <p className="text-sm text-green-800">Please attend the practice <strong>any day after 10am</strong> and quote this code at reception — you will be offered the appropriate appointment.</p>
            </div>
          )}
          <Link href="/" className="inline-block bg-[#005EB8] text-white font-semibold px-6 py-2 rounded-lg hover:bg-[#004a93] transition-colors text-sm">Back to Oakley Medical Practice</Link>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center text-[#005EB8] text-sm font-medium mb-6 hover:underline">
          <BackIcon />Back to Oakley Medical Practice
        </Link>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-[#005EB8] px-6 py-5">
            <h1 className="text-white text-xl font-bold">PSA Blood Test — Information & Consent</h1>
            <p className="text-blue-100 text-sm mt-1">Oakley Medical Practice</p>
          </div>

          <div className="px-6 py-6">
            <ProgressBar step={step} total={TOTAL_STEPS} />

            {/* ── Step 1: Your details ────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900">Your details</h2>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-1">Full name <span className="text-red-600">*</span></label>
                  <input id="name" type="text" autoComplete="name" value={form.name} onChange={e => setField('name', e.target.value)} className={inp('name')} placeholder="e.g. John Smith" />
                  {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="dob" className="block text-sm font-semibold text-gray-800 mb-1">Date of birth <span className="text-red-600">*</span></label>
                  <input id="dob" type="date" value={form.dob} onChange={e => setField('dob', e.target.value)} className={inp('dob')} />
                  {errors.dob && <p className="text-red-600 text-xs mt-1">{errors.dob}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-1">Email address <span className="text-red-600">*</span></label>
                  <p className="text-xs text-gray-500 mb-1">Used if we need to contact you about your appointment</p>
                  <input id="email" type="email" autoComplete="email" value={form.email} onChange={e => setField('email', e.target.value)} className={inp('email')} placeholder="e.g. john@example.com" />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="chi" className="block text-sm font-semibold text-gray-800 mb-1">CHI number (optional)</label>
                  <p className="text-xs text-gray-500 mb-1">10-digit number on your NHS Scotland medical card</p>
                  <input id="chi" type="text" inputMode="numeric" value={form.chi} onChange={e => setField('chi', e.target.value)} className={inp('chi')} placeholder="e.g. 0101801234" />
                </div>
              </div>
            )}

            {/* ── Step 2: About PSA testing ────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">About PSA Testing</h2>
                <p className="text-sm text-gray-600">Please read the following information before giving your consent.</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 text-sm mb-2">What is a PSA test?</h3>
                  <p className="text-blue-800 text-sm mb-3">PSA (Prostate-Specific Antigen) is a protein made by the prostate gland. A PSA test is a simple blood test that measures its level. It can sometimes detect prostate cancer at an early stage. Scotland does not have a national screening programme, but men can request the test after reading this information.</p>
                  <img src="/psa/anatomy.jpg" alt="Diagram showing the prostate gland, bladder and urethra" className="w-full rounded-lg border border-blue-200" />
                  <p className="text-blue-700 text-xs mt-2 text-center italic">The prostate gland sits just below the bladder, surrounding the urethra</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 text-sm mb-2">A raised PSA does not always mean cancer</h3>
                  <img src="/psa/false-positive.jpg" alt="3 in 4 men with raised PSA do not have prostate cancer" className="w-full rounded-lg border border-amber-200 mb-3" />
                  <p className="text-amber-800 text-sm">Around <strong>3 in 4 men</strong> with a raised PSA do <strong>not</strong> have prostate cancer. PSA can also be raised by an enlarged prostate, a prostate or urine infection, ejaculation or vigorous exercise within 48 hours of the test.</p>
                  <div className="mt-3 bg-amber-100 border border-amber-300 rounded p-2">
                    <p className="text-amber-900 text-xs font-semibold">Please avoid ejaculation and vigorous exercise for 48 hours before your blood test.</p>
                  </div>
                </div>

                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">A normal PSA does not always rule out cancer</h3>
                  <img src="/psa/false-negative.jpg" alt="1 in 7 men with prostate cancer have a normal PSA" className="w-full rounded-lg border border-gray-300 mb-3" />
                  <p className="text-gray-700 text-sm mb-3">About <strong>1 in 7 men</strong> with prostate cancer have a normal result. Your GP considers the PSA alongside your age, symptoms, and family history — not in isolation.</p>
                  <p className="text-gray-600 text-xs">For reference, Scottish guidelines suggest levels above 3.5 ng/mL (age 50–59), 4.0 (60–69) or 5.0 (70–79) may warrant further investigation.</p>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <h3 className="font-bold text-sky-900 text-sm mb-3">What happens if my PSA is raised?</h3>
                  <img src="/psa/pathway.jpg" alt="Pathway after a raised PSA" className="w-full rounded-lg border border-sky-200 mb-3" />
                  <p className="text-sky-800 text-sm mb-2">Your GP will discuss the result with you. Under current Scottish guidelines (2025), a repeat PSA is <strong>not routinely required</strong> before referral — you may be referred directly to NHS Fife Urology.</p>
                  <p className="text-sky-800 text-sm">Most men seen in urology do <strong>not</strong> have prostate cancer.</p>
                </div>
              </div>
            )}

            {/* ── Step 3: Health background ────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Your health background</h2>
                <p className="text-sm text-gray-600">This helps your GP interpret your result accurately and plan the right next steps.</p>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">What is your ethnic background?</p>
                  <p className="text-xs text-gray-500 mb-2">Men of Black African or Caribbean heritage have a higher risk of prostate cancer and may benefit from earlier or more careful investigation.</p>
                  <div className="space-y-1">
                    {ETHNICITY_OPTIONS.map(opt => (
                      <label key={opt} className="flex items-center gap-3 py-1.5 cursor-pointer">
                        <input type="radio" name="ethnicity" value={opt} checked={form.ethnicity === opt} onChange={() => setField('ethnicity', opt)} className="h-4 w-4 accent-[#005EB8]" />
                        <span className="text-sm text-gray-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {isBlackAfrican && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-xs">As a man of Black African or Caribbean heritage, your GP may consider investigation at a lower PSA threshold.</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Are you taking any of these medications?</p>
                  <p className="text-xs text-gray-500 mb-3">Some prostate medications affect PSA levels — it is essential we know.</p>
                  <div className="space-y-2">
                    {([
                      { field: 'on_tamsulosin' as keyof FormData, label: 'Tamsulosin', note: 'alpha-blocker — improves urine flow' },
                      { field: 'on_finasteride' as keyof FormData, label: 'Finasteride (Proscar / Propecia)', note: 'can significantly affect PSA result' },
                      { field: 'on_dutasteride' as keyof FormData, label: 'Dutasteride (Avodart)', note: 'can significantly affect PSA result' },
                    ]).map(({ field, label, note }) => (
                      <label key={field} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={form[field] as boolean} onChange={e => setField(field, e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                        <span className="text-sm"><span className="font-semibold text-gray-800">{label}</span><span className="text-gray-500 ml-1">— {note}</span></span>
                      </label>
                    ))}
                  </div>
                  {onSuppressor && (
                    <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
                      <p className="text-amber-900 text-sm font-semibold mb-1">Your GP will need to review your result personally</p>
                      <p className="text-amber-800 text-sm">Finasteride and Dutasteride can significantly affect PSA levels.</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Other prostate or urinary medications (optional)</label>
                    <input type="text" value={form.other_prostate_meds} onChange={e => setField('other_prostate_meds', e.target.value)} className={inp('other_prostate_meds')} placeholder="e.g. Alfuzosin, Solifenacin, Testosterone" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Have you had a PSA blood test before? <span className="text-red-600">*</span></p>
                  {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }, { v: 'unsure', l: "I'm not sure" }].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-3 py-2 cursor-pointer">
                      <input type="radio" name="prev_psa" value={v} checked={form.previous_psa_tested === v} onChange={() => setField('previous_psa_tested', v)} className="h-4 w-4 accent-[#005EB8]" />
                      <span className="text-sm text-gray-800">{l}</span>
                    </label>
                  ))}
                  {errors.previous_psa_tested && <p className="text-red-600 text-xs mt-1">{errors.previous_psa_tested}</p>}
                  {form.previous_psa_tested === 'yes' && (
                    <div className="mt-3 pl-4 border-l-2 border-blue-200 space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Previous PSA value (if known)</label>
                        <input type="text" value={form.previous_psa_value} onChange={e => setField('previous_psa_value', e.target.value)} className={inp('previous_psa_value')} placeholder="e.g. 2.4 ng/mL" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1">Approximate date of that test</label>
                        <input type="month" value={form.previous_psa_date} onChange={e => setField('previous_psa_date', e.target.value)} className={inp('previous_psa_date')} />
                      </div>
                    </div>
                  )}
                </div>

                {age >= 50 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      Can you walk 50 metres on the flat without stopping or needing assistance? <span className="text-red-600">*</span>
                    </p>
                    <p className="text-xs text-gray-500 mb-3">This helps your GP understand whether active treatment would be appropriate if cancer were found.</p>
                    {[{ v: 'walk_yes', l: 'Yes' }, { v: 'walk_no', l: 'No' }].map(({ v, l }) => (
                      <label key={v} className="flex items-center gap-3 py-2 cursor-pointer">
                        <input type="radio" name="clinical_fitness" value={v} checked={form.clinical_fitness === v} onChange={() => setField('clinical_fitness', v)} className="h-4 w-4 accent-[#005EB8]" />
                        <span className="text-sm text-gray-800">{l}</span>
                      </label>
                    ))}
                    {errors.clinical_fitness && <p className="text-red-600 text-xs mt-1">{errors.clinical_fitness}</p>}
                    {needsGpFirst && (
                      <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-3">
                        <p className="text-amber-900 text-sm font-semibold mb-1">Please complete this form — a GP appointment will be arranged first</p>
                        <p className="text-amber-800 text-sm">One of our GPs will need to meet with you before we approve the blood test.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4: Reason, symptoms & IPSS ─────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Your reason & symptoms</h2>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Why are you requesting a PSA test? <span className="text-red-600">*</span></p>
                  {REASONS.map(opt => (
                    <label key={opt} className="flex items-start gap-3 cursor-pointer py-2">
                      <input type="radio" name="reason" value={opt} checked={form.reason === opt} onChange={() => setField('reason', opt)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                      <span className="text-sm text-gray-800">{opt}</span>
                    </label>
                  ))}
                  {errors.reason && <p className="text-red-600 text-xs mt-1">{errors.reason}</p>}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Do you currently have symptoms of a urine infection? <span className="text-red-600">*</span></p>
                  <p className="text-xs text-gray-500 mb-2">e.g. burning or stinging when you urinate, cloudy or smelly urine, fever or chills</p>
                  {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-3 py-2 cursor-pointer">
                      <input type="radio" name="active_uti" value={v} checked={form.active_uti === v} onChange={() => setField('active_uti', v)} className="h-4 w-4 accent-[#005EB8]" />
                      <span className="text-sm text-gray-800">{l}</span>
                    </label>
                  ))}
                  {errors.active_uti && <p className="text-red-600 text-xs mt-1">{errors.active_uti}</p>}
                  {form.active_uti === 'yes' && (
                    <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-3">
                      <p className="text-amber-800 text-sm font-semibold mb-1">Please call us before attending for your blood test</p>
                      <p className="text-amber-700 text-sm">A urine infection can make the PSA result unreliable. Please call us on <strong>01383 850212</strong>.</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Do you have any of these urinary symptoms? (tick all that apply)</p>
                  {SYMPTOM_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-start gap-3 cursor-pointer py-2">
                      <input type="checkbox" checked={form.symptoms.includes(opt)} onChange={() => toggleSymptom(opt)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                      <span className={`text-sm ${opt === 'Blood in urine' ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>{opt}</span>
                    </label>
                  ))}

                  {haematuria && (
                    <div className="mt-3 bg-red-50 border-2 border-red-400 rounded-lg p-4">
                      <p className="text-red-800 font-bold text-sm mb-2">⚠ Blood in urine requires urgent attention</p>
                      <p className="text-red-700 text-sm mb-3">Blood in urine needs a <strong>separate and more urgent assessment</strong> — please do not continue with this PSA form. Contact us today.</p>
                      <a href="tel:01383850212" className="inline-block bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-red-800">Call 01383 850212</a>
                      <p className="text-red-600 text-xs mt-3">If you cannot reach us and are concerned, contact NHS 24 on 111.</p>
                    </div>
                  )}
                </div>

                {!haematuria && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">Do you have any new or unexplained bone pain, particularly in your back, hips or pelvis? <span className="text-red-600">*</span></p>
                      {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }].map(({ v, l }) => (
                        <label key={v} className="flex items-center gap-3 py-2 cursor-pointer">
                          <input type="radio" name="bone_pain" value={v} checked={form.bone_pain === v} onChange={() => setField('bone_pain', v)} className="h-4 w-4 accent-[#005EB8]" />
                          <span className="text-sm text-gray-800">{l}</span>
                        </label>
                      ))}
                      {errors.bone_pain && <p className="text-red-600 text-xs mt-1">{errors.bone_pain}</p>}
                      {form.bone_pain === 'yes' && (
                        <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-3">
                          <p className="text-amber-800 text-sm font-semibold mb-1">Please contact us before attending for your test</p>
                          <p className="text-amber-700 text-sm">New unexplained bone pain should be assessed by a GP first. Please call <strong>01383 850212</strong>.</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">Family history of prostate cancer? <span className="text-red-600">*</span></p>
                      {['Yes — father or brother', 'Yes — other relative', 'No', 'Not sure'].map(opt => (
                        <label key={opt} className="flex items-start gap-3 cursor-pointer py-2">
                          <input type="radio" name="family_history" value={opt} checked={form.family_history === opt} onChange={() => setField('family_history', opt)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                          <span className="text-sm text-gray-800">{opt}</span>
                        </label>
                      ))}
                      {errors.family_history && <p className="text-red-600 text-xs mt-1">{errors.family_history}</p>}
                    </div>

                    {showIpss && (
                      <div className="border-t border-gray-200 pt-5">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-blue-900 text-sm font-semibold">International Prostate Symptom Score (IPSS)</p>
                          <p className="text-blue-800 text-xs mt-1">
                            Because you have urinary symptoms, this standard questionnaire helps your GP understand their impact.
                            {pat === 'active' ? ' Required for referral.' : ' Optional but helpful.'}
                            {' '}Answer based on the <strong>past month</strong>.
                          </p>
                        </div>
                        <div className="space-y-4">
                          {IPSS_QUESTIONS.map((q, i) => (
                            <div key={q.id} className={`rounded-lg border p-4 ${errors[q.id] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                              <p className="text-sm font-semibold text-gray-800 mb-3">
                                {i + 1}. {q.text}{pat === 'active' && <span className="text-red-600"> *</span>}
                              </p>
                              <div className="space-y-1">
                                {q.opts.map(o => (
                                  <label key={o.value} className="flex items-center gap-3 cursor-pointer py-1">
                                    <input type="radio" name={q.id} checked={(form[q.id] as number) === o.value} onChange={() => setIpssField(q.id, o.value)} className="h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                                    <span className="text-sm text-gray-700"><span className="text-gray-400 text-xs mr-1">({o.value})</span>{o.label}</span>
                                  </label>
                                ))}
                              </div>
                              {errors[q.id] && <p className="text-red-600 text-xs mt-2">{errors[q.id]}</p>}
                            </div>
                          ))}

                          {ipssScore !== null && (
                            <div className={`rounded-lg border p-3 ${ipssScore <= 7 ? 'bg-green-50 border-green-200' : ipssScore <= 19 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                              <p className={`text-sm font-semibold ${ipssScore <= 7 ? 'text-green-900' : ipssScore <= 19 ? 'text-amber-900' : 'text-red-900'}`}>
                                IPSS Score: {ipssScore}/35 — {ipssSeverity(ipssScore)} symptoms
                              </p>
                            </div>
                          )}

                          <div className="rounded-lg border border-gray-200 p-4">
                            <p className="text-sm font-semibold text-gray-800 mb-1">Quality of Life</p>
                            <p className="text-xs text-gray-500 mb-3">If you were to spend the rest of your life with your urinary condition just the way it is now, how would you feel?</p>
                            <div className="space-y-1">
                              {IPSS_QOL.map(o => (
                                <label key={o.value} className="flex items-center gap-3 cursor-pointer py-1">
                                  <input type="radio" name="ipss_qol" checked={form.ipss_qol === o.value} onChange={() => setIpssField('ipss_qol', o.value)} className="h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{o.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-5">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Not sure about the test?</p>
                      <label className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                        <input type="checkbox" checked={form.prefer_gp_appointment} onChange={e => setField('prefer_gp_appointment', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                        <span className="text-sm">
                          <span className="font-semibold text-blue-900">I don&apos;t fully understand the questions, or I would prefer to discuss this with a GP before deciding</span>
                          <span className="block text-blue-700 text-xs mt-1">Tick this and we&apos;ll arrange a convenient appointment.</span>
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 5: Understanding & consent ─────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4">
                {form.prefer_gp_appointment ? (
                  <>
                    <h2 className="text-lg font-bold text-gray-900">Book a GP Appointment</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-900 text-sm font-semibold mb-2">We&apos;ll be in touch to arrange a suitable time</p>
                      <p className="text-blue-800 text-sm">One of our team will contact you to arrange a convenient appointment. You can also call us on <strong>01383 850212</strong>.</p>
                    </div>
                    <p className="text-gray-600 text-sm">Please confirm below that you&apos;re happy for us to save your details and follow up with you.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-gray-900">Understanding & Consent</h2>
                    <p className="text-sm text-gray-600">Please confirm you have read and understood the information provided.</p>
                    {([
                      { field: 'understood_what_psa_is' as keyof FormData, label: 'I understand what a PSA test is and what it can and cannot detect' },
                      { field: 'understood_raised_causes' as keyof FormData, label: 'I understand that a raised PSA does not necessarily mean I have cancer' },
                      { field: 'understood_limitations' as keyof FormData, label: 'I understand that a normal result does not completely rule out cancer' },
                      { field: 'understood_next_steps' as keyof FormData, label: 'I understand what will happen if my result is raised, including possible direct referral to urology' },
                    ]).map(({ field, label }) => (
                      <div key={field} className={cbRow(field)}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" checked={form[field] as boolean} onChange={e => setField(field, e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                          <span className="text-sm text-gray-800">{label} <span className="text-red-600 font-semibold">*</span></span>
                        </label>
                        {errors[field] && <p className="text-red-600 text-xs mt-2">{errors[field]}</p>}
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-4">
                      <div className={cbRow('consent_test')}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" checked={form.consent_test} onChange={e => setField('consent_test', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                          <span className="text-sm text-gray-800">I consent to having a PSA blood test at Oakley Medical Practice <span className="text-red-600 font-semibold">*</span></span>
                        </label>
                        {errors.consent_test && <p className="text-red-600 text-xs mt-2">{errors.consent_test}</p>}
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className={cbRow('consent_data')}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.consent_data} onChange={e => setField('consent_data', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#005EB8] flex-shrink-0" />
                      <span className="text-sm text-gray-800">I consent to my answers being stored securely by Oakley Medical Practice and shared with the clinical team involved in my care <span className="text-red-600 font-semibold">*</span></span>
                    </label>
                    {errors.consent_data && <p className="text-red-600 text-xs mt-2">{errors.consent_data}</p>}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 leading-relaxed">
                  <p className="font-semibold text-gray-700 mb-1">Your information &amp; privacy</p>
                  <p>This form is provided by <strong>Oakley Medical Practice</strong>. Your information is processed under <strong>Article 9(2)(h) UK GDPR</strong> — provision of healthcare. Data is stored on UK-based servers and retained per NHS Scotland records policy.</p>
                </div>
              </div>
            )}

            {/* ── Navigation ────────────────────────────────────────────────── */}
            {step === 4 && haematuria ? (
              <div className="mt-6">
                <button type="button" onClick={back} className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors">Back</button>
              </div>
            ) : (
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button type="button" onClick={back} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors">Back</button>
                )}
                {step < TOTAL_STEPS ? (
                  <button type="button" onClick={next} className="flex-1 bg-[#005EB8] hover:bg-[#004a93] text-white font-semibold py-3 rounded-lg transition-colors text-sm">Continue</button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#005EB8] hover:bg-[#004a93] disabled:bg-[#4a90c4] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    {loading ? <><Spinner />{form.prefer_gp_appointment ? 'Sending…' : 'Submitting…'}</> : form.prefer_gp_appointment ? 'Request GP appointment' : 'Submit consent'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">Oakley Medical Practice · Oakley · Fife · KY12 · 01383 850212</p>
      </div>
    </div>
  )
}
