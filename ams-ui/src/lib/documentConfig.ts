/**
 * Document Checklist Configuration
 * ─────────────────────────────────
 * Category-aware, stream-aware document definitions.
 * Used by WizardStep3 (digital tracking) and PrintAdmissionForm (printed checklist).
 */

export type DocTier = 'mandatory' | 'conditional' | 'optional'

export interface DocumentDef {
  type: string       // unique key, e.g. 'neet_admit_card'
  label: string      // display label
  tier: DocTier
  stream: 'medical' | 'engineering' | 'both'
  /** Returns true if document should be shown for this student */
  condition?: (formData: Record<string, any>) => boolean
}

const DOCUMENT_DEFINITIONS: DocumentDef[] = [
  // ── Mandatory (both streams) ─────────────────────────────────
  { type: 'student_photo', label: 'Student Photo (Passport size)', tier: 'mandatory', stream: 'both' },
  { type: 'aadhaar_card', label: 'Aadhaar Card Copy', tier: 'mandatory', stream: 'both' },
  { type: 'nationality_cert', label: 'Nationality Certificate / Valid Indian Passport / SLC', tier: 'mandatory', stream: 'both' },
  { type: 'domicile_cert', label: 'Domicile Certificate of the Candidate', tier: 'mandatory', stream: 'both' },
  { type: 'ssc_certificate', label: 'SSC (or Equivalent) Passing Certificate (For Date of Birth)', tier: 'mandatory', stream: 'both' },
  { type: 'hsc_marksheet', label: 'H.S.C (or Equivalent) Examination Marksheet', tier: 'mandatory', stream: 'both' },

  // ── Medical-only mandatory ───────────────────────────────────
  { type: 'neet_admit_card', label: 'Admit Card / Hall Ticket of NEET UG 2025', tier: 'mandatory', stream: 'medical' },
  { type: 'neet_marksheet', label: 'NEET-UG 2026 Marksheet', tier: 'mandatory', stream: 'medical' },
  { type: 'medical_fitness', label: 'Medical Fitness Certificate (Annexure-H)', tier: 'mandatory', stream: 'medical' },

  // ── Engineering-only mandatory ───────────────────────────────
  { type: 'cet_scorecard', label: 'MHT-CET PCM Score Card', tier: 'mandatory', stream: 'engineering' },
  { type: 'hsc_diploma', label: 'HSC Marksheet / 3-Year Diploma in Engineering Certificate', tier: 'mandatory', stream: 'engineering' },

  // ── Conditional: Category-based ──────────────────────────────
  { type: 'caste_cert', label: 'Caste Certificate', tier: 'conditional', stream: 'both',
    condition: (f) => !!f.category_of_candidate && f.category_of_candidate !== 'General / Open' && f.category_of_candidate !== 'EWS' },
  { type: 'caste_validity', label: 'Caste / Tribe Validity Certificate', tier: 'conditional', stream: 'both',
    condition: (f) => !!f.category_of_candidate && f.category_of_candidate !== 'General / Open' && f.category_of_candidate !== 'EWS' },
  { type: 'ncl_cert', label: 'Non-Creamy Layer Certificate (valid up to 31/03/2028)', tier: 'conditional', stream: 'both',
    condition: (f) => ['OBC', 'VJ-A', 'NT-B', 'NT-C', 'NT-D', 'SBC'].includes(f.category_of_candidate) },
  { type: 'ews_cert', label: 'EWS Certificate', tier: 'conditional', stream: 'both',
    condition: (f) => f.category_of_candidate === 'EWS' },
  { type: 'income_cert', label: 'Income Certificate (Annual Income ≤ ₹8 Lakh)', tier: 'conditional', stream: 'both',
    condition: (f) => f.category_of_candidate === 'EWS' || ['OBC', 'VJ-A', 'NT-B', 'NT-C', 'NT-D', 'SBC'].includes(f.category_of_candidate) },

  // ── Conditional: Flag-based ──────────────────────────────────
  { type: 'minority_cert', label: 'Minority Certificate', tier: 'conditional', stream: 'both',
    condition: (f) => f.claim_minority_quota === 'YES' },
  { type: 'pwd_cert', label: 'Person with Disability (PWD) Certificate', tier: 'conditional', stream: 'both',
    condition: (f) => f.is_pwd === 'YES' },
  { type: 'defence_cert', label: 'Defence Service Certificate (Proforma C/D/E)', tier: 'conditional', stream: 'engineering',
    condition: (f) => f.is_defence_ward === 'YES' },

  // ── Optional ─────────────────────────────────────────────────
  { type: 'bank_details', label: 'Bank Details (Cancelled Cheque / Bank Passbook)', tier: 'optional', stream: 'both' },
]

/**
 * Detect stream from course name.
 * PCB Group / Medical / Pharmacy / Nursing → 'medical'
 * PCM Group / Engineering → 'engineering'
 */
export function detectStream(courseName: string): 'medical' | 'engineering' {
  const cn = courseName.toLowerCase()
  if (cn.includes('engineering')) return 'engineering'
  return 'medical'   // default to medical (PCB) for pharmacy, nursing, medical
}

/**
 * Get documents applicable to a specific student based on stream + category + flags.
 */
export function getApplicableDocuments(
  courseName: string,
  formData: Record<string, any>
): DocumentDef[] {
  const stream = detectStream(courseName)
  return DOCUMENT_DEFINITIONS.filter(doc => {
    // Filter by stream
    if (doc.stream !== 'both' && doc.stream !== stream) return false
    // Check condition (if defined)
    if (doc.condition && !doc.condition(formData)) return false
    return true
  })
}

/**
 * Group documents by tier for display.
 */
export function groupByTier(docs: DocumentDef[]): {
  mandatory: DocumentDef[]
  conditional: DocumentDef[]
  optional: DocumentDef[]
} {
  return {
    mandatory: docs.filter(d => d.tier === 'mandatory'),
    conditional: docs.filter(d => d.tier === 'conditional'),
    optional: docs.filter(d => d.tier === 'optional'),
  }
}
