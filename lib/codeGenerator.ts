// ─── Word pools ───────────────────────────────────────────────────────────────

const GROUP_WORDS: Record<string, string[]> = {
  direct: ['brook', 'glen', 'vale', 'field', 'dawn', 'stone', 'crest', 'fern', 'moss', 'leaf'],
  assess: ['path', 'bridge', 'track', 'trail', 'route', 'ridge', 'cross', 'ford', 'gate', 'step'],
  review: ['haven', 'lodge', 'grace', 'perch', 'anchor', 'bay', 'cove', 'nest', 'port', 'rest'],
}

const WORDS = [
  'amber', 'apple', 'arrow', 'atlas', 'axle',
  'badger', 'birch', 'blade', 'bloom', 'bold',
  'cable', 'cedar', 'chalk', 'chess', 'cliff',
  'cobra', 'coral', 'crane', 'creek', 'crown',
  'ember', 'eagle', 'elder', 'elm',
  'flint', 'flood', 'forge', 'frost', 'furze',
  'grant', 'grave', 'grove', 'guard',
  'heath', 'holly', 'heron', 'hinge',
  'ivory', 'inlet',
  'jasper', 'junco',
  'kite', 'knoll',
  'lance', 'larch', 'lark', 'latch', 'ledge',
  'maple', 'march', 'marsh', 'mason', 'mast',
  'noble', 'notch',
  'ochre', 'olive', 'onyx',
  'pearl', 'pedal', 'perch', 'pine', 'plank', 'plume',
  'quartz', 'quest',
  'raven', 'resin', 'ridge', 'river', 'robin', 'rock',
  'sable', 'sage', 'salt', 'sand', 'scout', 'seal', 'slate', 'slope', 'smoke', 'spark', 'spire', 'spoke', 'sprig', 'stark', 'stern', 'stoke', 'storm', 'swift',
  'thorn', 'thyme', 'tidal', 'timber', 'torch', 'trout',
  'umber',
  'vault',
  'wade', 'wake', 'ward', 'wave', 'weld', 'wren',
  'yew',
  'zinc',
]

// ─── Hash ─────────────────────────────────────────────────────────────────────

function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h, 31) + str.charCodeAt(i)
    h = h | 0
  }
  return Math.abs(h)
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CodeInput = {
  symptoms: string[]
  on_finasteride: boolean
  on_dutasteride: boolean
  on_tamsulosin: boolean
  clinical_fitness: string
  active_uti: string
  bone_pain: string
  family_history: string
  reason: string
  ethnicity: string
  previous_psa_tested: string
  ipss_q1: number; ipss_q2: number; ipss_q3: number; ipss_q4: number
  ipss_q5: number; ipss_q6: number; ipss_q7: number; ipss_qol: number
  prefer_gp_appointment: boolean
  pathway: string
}

// ─── Group logic ──────────────────────────────────────────────────────────────

export type Group = 'direct' | 'assess' | 'review'

export function getGroup(form: CodeInput, age: number): Group {
  // Review — highest priority
  if (
    form.prefer_gp_appointment ||
    form.clinical_fitness === 'walk_no' ||
    form.active_uti === 'yes' ||
    form.bone_pain === 'yes' ||
    age < 50
  ) return 'review'

  // Assess — any urinary symptoms, on 5-ARI, or first-degree FH
  const hasSymptoms = form.symptoms.some(s => s !== 'None of these' && s !== 'Blood in urine')
  if (
    hasSymptoms ||
    form.on_finasteride ||
    form.on_dutasteride ||
    form.family_history === 'Yes — father or brother'
  ) return 'assess'

  return 'direct'
}

export const GROUP_LABELS: Record<Group, string> = {
  direct: 'Direct to PSA',
  assess:  'PSA + Appointment',
  review:  'GP Review',
}

export const GROUP_COLOURS: Record<Group, string> = {
  direct: 'bg-green-100 text-green-800',
  assess: 'bg-amber-100 text-amber-800',
  review: 'bg-red-100 text-red-800',
}

// ─── Code generator ───────────────────────────────────────────────────────────

export function generateCode(form: CodeInput, age: number): string {
  const group = getGroup(form, age)

  const clinical = {
    ethnicity: form.ethnicity,
    on_tamsulosin: form.on_tamsulosin,
    on_finasteride: form.on_finasteride,
    on_dutasteride: form.on_dutasteride,
    previous_psa_tested: form.previous_psa_tested,
    clinical_fitness: form.clinical_fitness,
    active_uti: form.active_uti,
    reason: form.reason,
    symptoms: [...form.symptoms].sort(),
    bone_pain: form.bone_pain,
    family_history: form.family_history,
    ipss_q1: form.ipss_q1, ipss_q2: form.ipss_q2, ipss_q3: form.ipss_q3,
    ipss_q4: form.ipss_q4, ipss_q5: form.ipss_q5, ipss_q6: form.ipss_q6,
    ipss_q7: form.ipss_q7, ipss_qol: form.ipss_qol,
    prefer_gp_appointment: form.prefer_gp_appointment,
    pathway: form.pathway,
  }

  const h = hash(JSON.stringify(clinical))
  const groupWords = GROUP_WORDS[group]

  const word1 = groupWords[h % groupWords.length]
  const word2 = WORDS[Math.abs(h >> 3) % WORDS.length]
  const word3 = WORDS[Math.abs(h >> 7) % WORDS.length]

  // Ensure word2 and word3 differ
  const word3Final = word2 === word3 ? WORDS[(Math.abs(h >> 7) + 1) % WORDS.length] : word3

  return `${word1}-${word2}-${word3Final}`
}
