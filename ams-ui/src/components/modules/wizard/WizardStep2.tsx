'use client'
import { GraduationCap, User, MapPin, Shield, BookOpen, ClipboardList, Loader2 } from 'lucide-react'
import { Field, WizSectionHeader, SearchSelect, inputClass, selectClass, readonlyClass } from './FormComponents'
import { STATES, getDistricts, getTalukas } from '@/lib/locationData'

export function WizardStep2({ p2, setP2, courseName, admissionNumber, saving, error, onSaveDraft, onNext, onBack }: {
  p2: Record<string, any>; setP2: (fn: (prev: Record<string, any>) => Record<string, any>) => void
  courseName: string; admissionNumber: string; saving: boolean; error: string
  onSaveDraft: () => void; onNext: () => void; onBack: () => void
}) {
  const s = (k: string, v: any) => setP2((f: Record<string, any>) => ({ ...f, [k]: v }))
  const cn = courseName.toLowerCase()
  const isEng = cn.includes('engineering') && cn.includes('admission')

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Admission badge */}
      {admissionNumber && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 flex items-center justify-between">
          <div><p className="text-blue-100 text-xs uppercase tracking-widest">Admission Number</p><p className="text-white text-2xl font-bold font-mono mt-1">{admissionNumber}</p></div>
          <div className="text-right"><p className="text-blue-100 text-xs">Step 2 of 5</p><p className="text-amber-300 text-sm font-semibold mt-1">Student Details</p></div>
        </div>
      )}

      {/* Exam Details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={GraduationCap} title={isEng ? 'JEE Details' : 'NEET-UG Details'} color="text-blue-700" />
        <div className="grid grid-cols-2 gap-4">
          {isEng ? (<>
            <Field label="JEE Roll No." half><input value={p2.jee_roll_no} onChange={e => s('jee_roll_no', e.target.value)} className={inputClass} /></Field>
            <Field label="JEE Application No." half><input value={p2.jee_application_no} onChange={e => s('jee_application_no', e.target.value)} className={inputClass} /></Field>
            <Field label="Date of Birth" half><input type="date" value={p2.dob} onChange={e => s('dob', e.target.value)} className={inputClass} /></Field>
            <Field label="JEE Rank" half><input type="number" value={p2.jee_rank} onChange={e => s('jee_rank', e.target.value)} className={inputClass} /></Field>
            <Field label="JEE Percentile" half><input type="number" step="0.01" value={p2.jee_percentile} onChange={e => s('jee_percentile', e.target.value)} className={inputClass} /></Field>
          </>) : (<>
            <Field label="NEET Roll No." half><input value={p2.neet_roll_no} onChange={e => s('neet_roll_no', e.target.value)} className={inputClass} /></Field>
            <Field label="NEET Application No." half><input value={p2.neet_application_no} onChange={e => s('neet_application_no', e.target.value)} className={inputClass} /></Field>
            <Field label="Date of Birth" half><input type="date" value={p2.dob} onChange={e => s('dob', e.target.value)} className={inputClass} /></Field>
            <Field label="NEET Rank" half><input type="number" value={p2.neet_rank} onChange={e => s('neet_rank', e.target.value)} className={inputClass} /></Field>
            <Field label="NEET Marks" half><input type="number" value={p2.neet_marks} onChange={e => s('neet_marks', e.target.value)} className={inputClass} /></Field>
          </>)}
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={User} title="Personal Information" color="text-purple-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" required half><input value={p2.full_name} onChange={e => s('full_name', e.target.value)} className={inputClass} /></Field>
          <Field label="Name changed after 10th?" half><select value={p2.name_changed} onChange={e => s('name_changed', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          <Field label="Father's Name" half><input value={p2.father_name} onChange={e => s('father_name', e.target.value)} className={inputClass} /></Field>
          <Field label="Mother's Name" half><input value={p2.mother_name} onChange={e => s('mother_name', e.target.value)} className={inputClass} /></Field>
          <Field label="Gender" half><select value={p2.gender} onChange={e => s('gender', e.target.value)} className={selectClass}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
          <Field label="Date of Birth" half><input type="date" value={p2.dob} onChange={e => s('dob', e.target.value)} className={inputClass} /></Field>
          <Field label="Mobile" half><input value={p2.mobile} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) s('mobile', v); }} className={inputClass} /></Field>
          <Field label="Email ID" half><input type="email" value={p2.email} onChange={e => s('email', e.target.value)} className={inputClass} /></Field>
          <Field label="Alternate Contact No." half><input value={p2.alternate_mobile} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) s('alternate_mobile', v); }} className={inputClass} /></Field>
          <Field label="Aadhaar Card No." half><input value={p2.aadhaar_no} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 12) s('aadhaar_no', v); }} className={inputClass} /></Field>
          <Field label="Religion" half><select value={p2.religion} onChange={e => s('religion', e.target.value)} className={selectClass}><option value="">Select</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Buddhist</option><option>Sikh</option><option>Jain</option><option>Other</option></select></Field>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={MapPin} title="Permanent Address" color="text-emerald-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address Line 1" half><input value={p2.address_line1} onChange={e => s('address_line1', e.target.value)} className={inputClass} /></Field>
          <Field label="Address Line 2" half><input value={p2.address_line2} onChange={e => s('address_line2', e.target.value)} className={inputClass} /></Field>
          <Field label="Address Line 3" half><input value={p2.address_line3} onChange={e => s('address_line3', e.target.value)} className={inputClass} /></Field>
          <Field label="City" half><input value={p2.city} onChange={e => s('city', e.target.value)} className={inputClass} /></Field>
          <Field label="State" half><SearchSelect value={p2.state} onChange={v => { s('state', v); s('district', ''); s('taluka', '') }} options={[...STATES]} placeholder="Select State" /></Field>
          <Field label="District" half>{p2.state === 'Other' ? <input value={p2.district} onChange={e => { s('district', e.target.value); s('taluka', '') }} placeholder="Enter District" className={inputClass} /> : <SearchSelect value={p2.district} onChange={v => { s('district', v); s('taluka', '') }} options={getDistricts(p2.state)} placeholder="Select District" disabled={!p2.state} />}</Field>
          <Field label="Taluka" half>{p2.state === 'Other' ? <input value={p2.taluka} onChange={e => s('taluka', e.target.value)} placeholder="Enter Taluka" className={inputClass} /> : <SearchSelect value={p2.taluka} onChange={v => s('taluka', v)} options={getTalukas(p2.state, p2.district)} placeholder="Select Taluka" disabled={!p2.district} />}</Field>
          <Field label="Pin Code" half><input value={p2.pincode} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 6) s('pincode', v); }} className={inputClass} /></Field>
        </div>
      </div>

      {/* Reservation */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={Shield} title="Reservation" color="text-rose-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Apply for NRI?" half><select value={p2.apply_nri} onChange={e => s('apply_nri', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          <Field label="OCI/PIO card holder?" half><select value={p2.oci_pio} onChange={e => s('oci_pio', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          <Field label="Nationality" half><select value={p2.nationality} onChange={e => s('nationality', e.target.value)} className={selectClass}><option value="">Select</option><option>Indian</option><option>NRI</option><option>Foreign</option></select></Field>
          <Field label="Domicile of Maharashtra?" half><select value={p2.domicile_maharashtra} onChange={e => s('domicile_maharashtra', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          <Field label="Is candidate an orphan?" half><select value={p2.is_orphan} onChange={e => s('is_orphan', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          <Field label="Annual Family Income" half><select value={p2.annual_income} onChange={e => s('annual_income', e.target.value)} className={selectClass}><option value="">Select</option><option>Below 1 Lakh</option><option>1-2.5 Lakh</option><option>2.5-5 Lakh</option><option>5-8 Lakh</option><option>8-10 Lakh</option><option>Above 10 Lakh</option></select></Field>
          <Field label="Region of Residence" half><select value={p2.region_of_residence} onChange={e => s('region_of_residence', e.target.value)} className={selectClass}><option value="">Select</option><option>Vidarbha</option><option>Marathwada</option><option>Rest of Maharashtra</option><option>Outside Maharashtra</option></select></Field>
          <Field label="PWD?" half><select value={p2.is_pwd} onChange={e => s('is_pwd', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          <Field label="Category of Candidate" half><select value={p2.category_of_candidate} onChange={e => s('category_of_candidate', e.target.value)} className={selectClass}><option value="">Select</option><option>General / Open</option><option>OBC</option><option>SC</option><option>ST</option><option>VJ-A</option><option>NT-B</option><option>NT-C</option><option>NT-D</option><option>SBC</option><option>EWS</option></select></Field>
          <Field label="Sub Category" half><input value={p2.sub_category} onChange={e => s('sub_category', e.target.value)} className={inputClass} /></Field>
          <Field label="Claim Minority Quota?" half><select value={p2.claim_minority_quota} onChange={e => { s('claim_minority_quota', e.target.value); if (e.target.value !== 'YES') s('selected_minority', '') }} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          {p2.claim_minority_quota === 'YES' && (
            <Field label="Select Minority" half><select value={p2.selected_minority} onChange={e => s('selected_minority', e.target.value)} className={selectClass}><option value="">Select Minority</option><option>Muslim</option><option>Christian</option><option>Buddhist</option><option>Sikh</option><option>Jain</option><option>Parsi / Zoroastrian</option><option>Other</option></select></Field>
          )}
          <Field label="Claim Linguistic Minority?" half><select value={p2.claim_linguistic_minority} onChange={e => { s('claim_linguistic_minority', e.target.value); if (e.target.value !== 'YES') s('selected_linguistic_minority', '') }} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          {p2.claim_linguistic_minority === 'YES' && (
            <Field label="Select Linguistic Minority" half><select value={p2.selected_linguistic_minority} onChange={e => s('selected_linguistic_minority', e.target.value)} className={selectClass}><option value="">Select Language</option><option>Urdu</option><option>Sindhi</option><option>Gujarati</option><option>Kannada</option><option>Telugu</option><option>Tamil</option><option>Malayalam</option><option>Other</option></select></Field>
          )}
        </div>
      </div>

      {/* SSC */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={BookOpen} title="SSC / 10th Qualification" color="text-amber-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="SSC Board" half><select value={p2.ssc_board} onChange={e => s('ssc_board', e.target.value)} className={selectClass}><option value="">Select Board</option><option>CBSE</option><option>ICSE (CISCE)</option><option>NIOS</option><option>IB (International Baccalaureate)</option><option>Cambridge (IGCSE)</option><option>Maharashtra State Board</option><option>Andhra Pradesh Board</option><option>Assam Board (SEBA)</option><option>Bihar Board (BSEB)</option><option>Chhattisgarh Board (CGBSE)</option><option>Goa Board (GBSHSE)</option><option>Gujarat Board (GSEB)</option><option>Haryana Board (BSEH)</option><option>Himachal Pradesh Board (HPBOSE)</option><option>Jharkhand Board (JAC)</option><option>Karnataka Board (KSEEB)</option><option>Kerala Board (KBPE)</option><option>Madhya Pradesh Board (MPBSE)</option><option>Manipur Board (BSEM)</option><option>Meghalaya Board (MBOSE)</option><option>Mizoram Board (MBSE)</option><option>Nagaland Board (NBSE)</option><option>Odisha Board (BSE)</option><option>Punjab Board (PSEB)</option><option>Rajasthan Board (RBSE)</option><option>Tamil Nadu Board</option><option>Telangana Board (BSETS)</option><option>Tripura Board (TBSE)</option><option>Uttar Pradesh Board (UPMSP)</option><option>Uttarakhand Board (UBSE)</option><option>West Bengal Board (WBBSE)</option><option>J&K Board (JKBOSE)</option><option>Other</option></select></Field>
          <Field label="Year of Passing" half><input value={p2.ssc_year} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 4) s('ssc_year', v); }} placeholder="e.g. 2022" className={inputClass} /></Field>
          <Field label="Language / Medium" half><select value={p2.ssc_language} onChange={e => s('ssc_language', e.target.value)} className={selectClass}><option value="">Select</option><option>Marathi</option><option>English</option><option>Hindi</option><option>Urdu</option><option>Other</option></select></Field>
          <Field label="State" half><SearchSelect value={p2.ssc_state} onChange={v => { s('ssc_state', v); s('ssc_district', ''); s('ssc_taluka', '') }} options={[...STATES]} placeholder="Select State" /></Field>
          <Field label="District" half>{p2.ssc_state === 'Other' ? <input value={p2.ssc_district} onChange={e => { s('ssc_district', e.target.value); s('ssc_taluka', '') }} className={inputClass} /> : <SearchSelect value={p2.ssc_district} onChange={v => { s('ssc_district', v); s('ssc_taluka', '') }} options={getDistricts(p2.ssc_state)} placeholder="Select District" disabled={!p2.ssc_state} />}</Field>
          <Field label="Taluka" half>{p2.ssc_state === 'Other' ? <input value={p2.ssc_taluka} onChange={e => s('ssc_taluka', e.target.value)} className={inputClass} /> : <SearchSelect value={p2.ssc_taluka} onChange={v => s('ssc_taluka', v)} options={getTalukas(p2.ssc_state, p2.ssc_district)} placeholder="Select Taluka" disabled={!p2.ssc_district} />}</Field>
          <Field label="School Name" half><input value={p2.ssc_school_name} onChange={e => s('ssc_school_name', e.target.value)} className={inputClass} /></Field>
          <Field label="SSC Roll / Seat No." half><input value={p2.ssc_roll_no} onChange={e => s('ssc_roll_no', e.target.value)} className={inputClass} /></Field>
        </div>
      </div>

      {/* HSC */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={BookOpen} title="HSC / 12th Qualification" color="text-amber-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name as per HSC Marksheet" half><input value={p2.hsc_name} onChange={e => s('hsc_name', e.target.value)} className={inputClass} /></Field>
          <Field label="HSC Equivalent Examination" half><select value={p2.hsc_exam} onChange={e => s('hsc_exam', e.target.value)} className={selectClass}><option value="">Select</option><option>HSC</option><option>CBSE</option><option>ICSE</option><option>IB</option><option>NIOS</option><option>Other</option></select></Field>
          <Field label="Passing Year" half><select value={p2.hsc_passing_year} onChange={e => s('hsc_passing_year', e.target.value)} className={selectClass}><option value="">Select</option>{[2026,2025,2024,2023,2022,2021,2020].map(y => <option key={y}>{y}</option>)}</select></Field>
          <Field label="Roll No." half><input value={p2.hsc_roll_no} onChange={e => s('hsc_roll_no', e.target.value)} className={inputClass} /></Field>
          <Field label="State" half><SearchSelect value={p2.hsc_state} onChange={v => { s('hsc_state', v); s('hsc_district', ''); s('hsc_taluka', '') }} options={[...STATES]} placeholder="Select State" /></Field>
          <Field label="District" half>{p2.hsc_state === 'Other' ? <input value={p2.hsc_district} onChange={e => { s('hsc_district', e.target.value); s('hsc_taluka', '') }} className={inputClass} /> : <SearchSelect value={p2.hsc_district} onChange={v => { s('hsc_district', v); s('hsc_taluka', '') }} options={getDistricts(p2.hsc_state)} placeholder="Select District" disabled={!p2.hsc_state} />}</Field>
          <Field label="Taluka" half>{p2.hsc_state === 'Other' ? <input value={p2.hsc_taluka} onChange={e => s('hsc_taluka', e.target.value)} className={inputClass} /> : <SearchSelect value={p2.hsc_taluka} onChange={v => s('hsc_taluka', v)} options={getTalukas(p2.hsc_state, p2.hsc_district)} placeholder="Select Taluka" disabled={!p2.hsc_district} />}</Field>
          <Field label="Exam Session" half><select value={p2.hsc_exam_session} onChange={e => s('hsc_exam_session', e.target.value)} className={selectClass}><option value="">Select</option><option>February</option><option>March</option><option>October</option></select></Field>
        </div>
      </div>

      {/* Subject Marks */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={ClipboardList} title="Subject Details (12th Marks)" color="text-blue-700" />
        <div className="space-y-4">
          {[
            { label: 'Physics', key: 'physics' },
            { label: 'Chemistry', key: 'chemistry' },
            ...(isEng ? [{ label: 'Mathematics', key: 'maths' }] : [{ label: 'Biology', key: 'biology' }]),
            { label: 'English', key: 'english' },
          ].map(sub => (
            <div key={sub.key} className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-end">
              <div><p className="text-sm font-semibold text-gray-800">{sub.label}</p></div>
              <input type="number" value={p2[`${sub.key}_obtained`] || ''} onChange={e => {
                const val = e.target.value; const n = { ...p2, [`${sub.key}_obtained`]: val }
                const p = parseFloat(n.physics_obtained) || 0, c = parseFloat(n.chemistry_obtained) || 0
                const m = parseFloat(n.maths_obtained) || 0, b = parseFloat(n.biology_obtained) || 0, eng = parseFloat(n.english_obtained) || 0
                n.pcb_obtained = (p+c+b).toString(); n.pcb_percentage_obtained = b>0 ? ((p+c+b)/3).toFixed(2) : '0'
                n.pcbe_obtained = (p+c+b+eng).toString(); n.pcbe_percentage_obtained = b>0 ? ((p+c+b+eng)/4).toFixed(2) : '0'
                n.pcm_obtained = (p+c+m).toString(); n.pcm_percentage_obtained = m>0 ? ((p+c+m)/3).toFixed(2) : '0'
                n.pcme_obtained = (p+c+m+eng).toString(); n.pcme_percentage_obtained = m>0 ? ((p+c+m+eng)/4).toFixed(2) : '0'
                setP2(() => n)
              }} placeholder="Marks" className={inputClass} />
              <div className="flex items-center gap-2"><span className="text-xs text-gray-500">out of</span><input value={100} readOnly className={readonlyClass} /></div>
            </div>
          ))}
          <hr className="my-4 border-gray-200" />
          {(isEng ? [
            { label: 'PCM Total', key: 'pcm', out: 300 }, { label: 'PCM %', key: 'pcm_percentage', out: 100 },
            { label: 'PCME Total', key: 'pcme', out: 400 }, { label: 'PCME %', key: 'pcme_percentage', out: 100 },
          ] : [
            { label: 'PCB Total', key: 'pcb', out: 300 }, { label: 'PCB %', key: 'pcb_percentage', out: 100 },
            { label: 'PCBE Total', key: 'pcbe', out: 400 }, { label: 'PCBE %', key: 'pcbe_percentage', out: 100 },
          ]).map(sub => (
            <div key={sub.key} className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-end">
              <div><p className="text-sm font-semibold text-gray-800">{sub.label}</p><p className="text-[10px] text-emerald-600 font-medium">Auto-calculated</p></div>
              <input value={p2[`${sub.key}_obtained`] || '0'} readOnly className={readonlyClass} />
              <div className="flex items-center gap-2"><span className="text-xs text-gray-500">out of</span><input value={sub.out} readOnly className={readonlyClass} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Parallel Reservation & Application */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <WizSectionHeader icon={Shield} title="Parallel Reservation & Application" color="text-rose-700" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Claim Exception?" half><select value={p2.claim_exception} onChange={e => s('claim_exception', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
          <Field label="Specified Reservation" half>
            <div className="space-y-2 pt-1">{['Hilly Area','Defence Quota','MKB'].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="specified_reservation" value={opt} checked={p2.specified_reservation===opt} onChange={e => s('specified_reservation', e.target.value)} className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-700">{opt}</span></label>
            ))}</div>
          </Field>
          <Field label="I want to apply for" half><select value={p2.quota_apply_for} onChange={e => s('quota_apply_for', e.target.value)} className={selectClass}><option value="">Select</option><option>ONLY STATE QUOTA</option><option>ONLY INSTITUTE QUOTA (FOR ALL COURSES)</option><option>BOTH STATE AND INSTITUTE QUOTA</option><option>ONLY ALLIED COURSES STATE AND INSTITUTE QUOTA</option></select></Field>
          <Field label="All documents received?" half><select value={p2.documents_received} onChange={e => s('documents_received', e.target.value)} className={selectClass}><option value="">Select</option><option>YES</option><option>NO</option></select></Field>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>}

      <div className="flex items-center gap-4 pb-8">
        <button onClick={onBack} className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">← Back</button>
        <button onClick={onSaveDraft} disabled={saving} className="px-6 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : null} Save Draft
        </button>
        <button onClick={onNext} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          Continue →
        </button>
      </div>
    </div>
  )
}
