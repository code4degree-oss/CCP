# Old System Working

This document contains the detailed operational workflow and exhaustive list of input fields for the legacy live system `vibrantcareerguidance.in`.

---

## 🔄 The Two-Phase Workflow Architecture

The old system employs a "Payment-First, Profile-Later" workflow for managing admissions, ensuring every academic record is tied to a valid financial transaction.

### Phase 1: Initiating Admission (Fee Collection)
The process begins when a counselor clicks **"New Admission Fees"**.
1. The admin logs the student's basic contact details.
2. The admin immediately processes the application fee (recording the amount, transaction mode, and ID).
3. Upon clicking submit, the system registers the financial transaction and automatically mints a unique globally identifiable Admission Number (e.g., `VCG003060`).
4. **Output:** A printable PDF receipt is generated instantly, and the dashboard marks this as a new, incomplete admission ("Documents Pending").

### Phase 2: Comprehensive Profile Completion
The admission is considered "draft" or "incomplete" until the academic profile is filled.
1. The admin clicks the newly minted ID from the admissions dashboard.
2. This opens the **Complete Admission Form**—a massive, single-page application requiring precise data entry.
3. The admin inputs all past educational history (SSC/HSC marks detailed by subject), category/caste documentation, and NEET rankings.
4. **Output:** Upon submission, the student's profile is locked in, and they are fully registered in the system.

### The Enquiry Module Workflow
- The **Enquiry** module is an isolated digital logbook for tracking potential walk-ins.
- **Disconnected:** There is no "Convert to Admission" button or option to pull an existing enquiry into the admission workflow. If an enquired student decides to join, their data must be manually re-typed into the Phase 1 Admission Fees form.

---

## 📋 Comprehensive Field Breakdown

### 📝 1. Enquiry Module Fields
*A single-page form used to track potential student walk-ins or calls.*

**Candidate Info**
- Full Name
- Mother Name
- Gender (Male / Female / Other)
- Date of Birth
- Candidate's Mobile No.
- Parent's Mobile No.
- Category (General, OBC, SC, ST, etc.)
- Candidate Type (Fresher / Repeater)

**Score Info & NEET Info**
- HSC Percentage
- NEET Application No.
- NEET Roll No.
- NEET Expected Marks
- Looking For Which Course? (MBBS, BDS, BAMS, BHMS, etc.)

**Other Info**
- Tuition Name
- Reference Name
- How Do You Know About Us? (Newspaper, Social Media, Friend, etc.)
- Interested in Other States Counselling? (Yes / No)
- Interested in Overseas Education? (Yes / No)
- Vibrant Branch (e.g., Latur, Pune)

---

### 🎓 2. Admission Module Fields
*The official admission process is broken into the initial fee payment and the full academic profile.*

#### Step 1: Initial Fee Processing ("New Admission Fees" Form)
- Student Name
- Student Mobile Number
- Parent Mobile Number
- Course Selection
- Application Fees (Total required)
- Paid Amount (Amount depositing now)
- Transaction Mode (Cash, Online, Cheque)
- Transaction ID (If Online/Cheque)
- Remarks

#### Step 2: Full Academic Profile ("Complete Admission" Form)
*Accessed by clicking the `VCG` ID after completing Step 1.*

**Registration & Personal**
- NEET-UG Roll No.
- NEET-UG Application No.
- System Username & Password *(Counselor creates this for the student)*
- Full Name of Candidate *(Must match NEET scorecard)*
- Name Change Status (Yes / No)
- Father's Name & Mother's Name
- Gender & Date of Birth
- Email Address & Alternate Mobile No.
- Aadhar Card No.

**Demographics & Quotas**
- Nationality & Domicile of Maharashtra (Yes / No)
- Category & Caste Name
- Region of Residence (Vidarbha, Marathwada, Rest of Maharashtra)
- Annual Family Income Bracket
- Orphan / PWD / Defence Category / Hilly Area?
- Religion, Minority Claim, Religious Minority, Linguistic Minority

**Permanent Address**
- Address Line 1, 2, 3
- State, District, Taluka, City/Village, Pin Code

**10th (SSC) Education History**
- Name as per SSC Marksheet
- Passing Year & SSC Roll/Seat No.
- School Name & Address
- District, State, and Taluka of SSC passing

**12th (HSC) Education History**
- Name as per HSC Marksheet
- Passing Year & HSC Roll/Seat No.
- College Name & Address
- District, State, and Taluka of HSC passing

**12th Subject Marks (Requires Marks Obtained & Marks Out Of)**
- Physics
- Chemistry
- Biology
- English
- PCB Total Aggregate
- PCBE Total Aggregate

**NEET Official Processing Data**
- NEET Percentiles (Physics, Chemistry, Biology, Total Percentile)
- NEET Total Marks Received
- All India Rank (AIR)
- Category Rank
- "I Want to Apply For" *(Quota selection dropdown)*
- Are all documents received? (Yes / No)
