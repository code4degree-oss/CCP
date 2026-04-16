// ─── Enums / Unions ───────────────────────────────────────────────────────────

export type Role = 'super_admin' | 'admin' | 'counselor' | 'telecaller'

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted' | 'lost'
export type AdmissionStatus = 'draft' | 'review' | 'pending_docs' | 'admitted' | 'rejected'
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type Channel = 'whatsapp' | 'sms' | 'email'
export type FollowupMode = 'call' | 'whatsapp' | 'email' | 'visit'
export type DocumentStatus = 'uploaded' | 'verified' | 'rejected' | 'pending'

// ─── Organization / Branch ────────────────────────────────────────────────────

export interface Organization {
  id: number
  name: string
  slug: string
  isActive: boolean
  createdAt: string
}

export interface Branch {
  id: number
  organizationId: number
  name: string
  city: string
  state: string
  district: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  fullName: string
  email: string
  mobile: string
  role: Role
  roleId: number
  branch: string
  isActive: boolean
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface UserBranch {
  id: number
  userId: number
  branchId: number
  createdAt: string
}

// ─── Lead Source ──────────────────────────────────────────────────────────────

export interface LeadSource {
  id: number
  name: string
  isActive: boolean
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: number
  branchId?: number
  sourceId?: number
  createdById?: number
  assignedToId?: number
  studentName: string
  mobile: string
  alternateMobile?: string
  courseInterest: string
  status: LeadStatus
  source: string
  assignedTo: string
  branch: string
  nextFollowupAt: string
  remarks?: string
  createdAt: string
  updatedAt?: string
  // Nested for UI
  followups?: LeadFollowup[]
}

// ─── Lead Follow-up ──────────────────────────────────────────────────────────

export interface LeadFollowup {
  id: number
  leadId: number
  userId: number
  userName: string
  followupAt: string
  mode: FollowupMode
  status: LeadStatus
  remarks: string
  createdAt: string
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Student {
  id: number
  leadId?: number
  branchId?: number
  counselorId?: number
  enrollmentNo: string
  fullName: string
  fatherName: string
  motherName: string
  dob: string
  gender: 'Male' | 'Female' | 'Other'
  mobile: string
  email: string
  aadhaarNo: string
  branch: string
  counselor: string
  neetRank?: number
  neetMarks?: number
  category: string
  createdAt: string
  updatedAt?: string
  // Nested sub-models for UI
  personal?: StudentPersonal
  address?: StudentAddress
  categoryDetails?: StudentCategory
  academic?: StudentAcademic
  documents?: StudentDocument[]
  credential?: StudentCredential
}

// ─── Student Personal ─────────────────────────────────────────────────────────

export interface StudentPersonal {
  id: number
  studentId: number
  neetRollNo?: string
  applicationNo?: string
  neetRank?: number
  neetMarks?: number
  religion?: string
  nationality?: string
  isNameChanged: boolean
  nriInterest: boolean
  ociPioHolder: boolean
  maharashtraDomicile: boolean
  pwd: boolean
  orphan: boolean
  minorityClaim: boolean
  linguisticMinorityClaim: boolean
  selectedMinority?: string
  selectedLinguisticMinority?: string
  updatedAt?: string
}

// ─── Student Address ──────────────────────────────────────────────────────────

export interface StudentAddress {
  id: number
  studentId: number
  addressLine?: string
  city?: string
  state?: string
  district?: string
  taluka?: string
  pincode?: string
  regionOfResidence?: string
  updatedAt?: string
}

// ─── Student Category ─────────────────────────────────────────────────────────

export interface StudentCategory {
  id: number
  studentId: number
  category?: string
  subCategory?: string
  annualFamilyIncome?: number
  casteCertStatus?: string
  casteCertNo?: string
  casteCertDistrict?: string
  casteValidityStatus?: string
  casteValidityNo?: string
  casteValidityDistrict?: string
  casteValidityApplicationDate?: string
  casteValidityApplicationNo?: string
  nclStatus?: string
  nclCertificateNo?: string
  nclDistrict?: string
  nclCertificateDate?: string
  ewsCertificateNo?: string
  ewsDistrict?: string
  updatedAt?: string
}

// ─── Student Academic ─────────────────────────────────────────────────────────

export interface StudentAcademic {
  id: number
  studentId: number
  sscQualification?: string
  sscPassingYear?: number
  sscLanguage?: string
  sscState?: string
  sscDistrict?: string
  sscTaluka?: string
  hscResult?: string
  hscPassingYear?: number
  hscRollNo?: string
  hscState?: string
  hscDistrict?: string
  hscTaluka?: string
  physicsMarks?: number
  chemistryMarks?: number
  biologyMarks?: number
  englishMarks?: number
  pcbTotal?: number
  pcbeTotal?: number
  pcbPercentage?: number
  pcbePercentage?: number
  parallelReservation?: string
  reservationException?: string
  specifiedReservation?: string
  defenceQuota?: string
  hillyAreaVillage?: string
  hillyAreaTaluka?: string
  updatedAt?: string
}

// ─── Student Document ─────────────────────────────────────────────────────────

export interface StudentDocument {
  id: number
  studentId: number
  documentType: string
  fileUrl: string
  status: DocumentStatus
  uploadedBy: number
  uploadedAt: string
}

// ─── Student Credential ──────────────────────────────────────────────────────

export interface StudentCredential {
  id: number
  studentId: number
  username: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

// ─── Admission ────────────────────────────────────────────────────────────────

export interface Admission {
  id: number
  studentId?: number
  branchId?: number
  managerId?: number
  streamId?: number
  student: string
  enrollmentNo: string
  branch: string
  stream: string
  status: AdmissionStatus
  applicationScope?: string
  applicationFees: number
  feePaid: boolean
  admittedAt?: string
  notes?: string
  manager: string
  college?: string
  course?: string
  createdAt?: string
  updatedAt?: string
  // Nested for UI
  preferences?: AdmissionPreference[]
  payments?: Payment[]
  statusHistory?: StatusHistory[]
}

// ─── Course / Stream / College ────────────────────────────────────────────────

export interface CourseStream {
  id: number
  name: string
  isActive: boolean
}

export interface College {
  id: number
  name: string
  state: string
  district: string
  isActive: boolean
  createdAt: string
}

export interface Course {
  id: number
  streamId: number
  name: string
  isActive: boolean
}

// ─── Admission Preference ─────────────────────────────────────────────────────

export interface AdmissionPreference {
  id: number
  admissionId: number
  collegeId: number
  courseId: number
  collegeName: string
  courseName: string
  preferenceOrder: number
  quotaType: string
  status: string
  createdAt: string
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: number
  admissionId: number
  amount: number
  paymentType: string
  status: PaymentStatus
  referenceNo: string
  paidAt?: string
  createdAt: string
}

// ─── Status History ───────────────────────────────────────────────────────────

export interface StatusHistory {
  id: number
  admissionId: number
  fromStatus: string
  toStatus: string
  changedBy: number
  changedByName: string
  changedAt: string
  remarks?: string
}

// ─── Notification Log ─────────────────────────────────────────────────────────

export interface Notification {
  id: number
  student: string
  channel: Channel
  template: string
  status: 'delivered' | 'failed' | 'pending'
  sentAt: string
  admissionId: number
  sentBy?: number
  payload?: Record<string, unknown>
  deliveryStatus?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalLeads: number
  totalStudents: number
  totalAdmissions: number
  pendingAdmissions: number
  revenue: number
  conversionRate: number
}
