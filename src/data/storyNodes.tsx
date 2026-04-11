import {
  AlertTriangle,
  Scale,
  EyeOff,
  ShieldAlert,
  Search,
  XCircle,
  Shield,
  ClipboardList,
  FileCheck,
  CheckCircle2,
  Home,
  Building2,
  Heart,
  Handshake,
} from 'lucide-react';
import type { StoryNodes, Edge } from '../types';
import {
  START_STATISTICS,
  SCR_SCREENING_STATISTICS,
  SAFETY_ASSESSMENT_STATISTICS,
  CARES_TRACK_STATISTICS,
  INVESTIGATION_STATISTICS,
  DETERMINATION_STATISTICS,
  CASE_PLAN_STATISTICS,
  COURT_FILING_STATISTICS,
  COURT_HEARING_STATISTICS,
  SUPERVISION_ORDER_STATISTICS,
  FOSTER_CARE_REMOVAL_STATISTICS,
  KINSHIP_PLACEMENT_STATISTICS,
  GROUP_HOME_STATISTICS,
} from './statistics';

// ─── Canvas Layout ────────────────────────────────────────────────────────────
// Canvas: 6700 × 4500 px
//
// Main horizontal spine:   y ≈ 2000
// Better-outcome branches: y ≈ 600–900  (screened out, CARES, unsubstantiated)
// Supervision endpoint:    y ≈ 1100     (Maria's path ends here)
// Removal branches:        y ≈ 2950–3550

const STORY_NODES: StoryNodes = {

  // ── 1. Hotline Call ─────────────────────────────────────────────────────────

  start: {
    id: 'start', x: 350, y: 2000, category: 'hotline',
    title: 'Call to SCR Hotline',
    description:
      'Someone has called the State Central Register (SCR) hotline to report your family for alleged neglect. Callers can be mandated reporters — teachers, doctors, hospital staff — or anonymous members of the public. You may never learn who called or exactly what was said.',
    icon: <ShieldAlert className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" />,
    statistics: START_STATISTICS,
    choices: [{ text: 'Report sent to SCR Screening', nextNodeId: 'scr_screening' }],
  },

  // ── 2. SCR Screening ────────────────────────────────────────────────────────

  scr_screening: {
    id: 'scr_screening', x: 1000, y: 2000, category: 'hotline',
    title: 'SCR Screening',
    description:
      'An SCR operator evaluates the report against New York State legal criteria. To be "screened in," the report must identify a child under 18, a caregiver with a legal duty of care, a failure to meet minimum standards, and imminent risk of harm. All four must be present — but in practice, the bar is low.',
    icon: <Search className="w-8 h-8 md:w-12 md:h-12 text-blue-400" />,
    statistics: SCR_SCREENING_STATISTICS,
    choices: [
      { text: 'Report does not meet criteria — Screened Out', nextNodeId: 'screened_out' },
      { text: 'Report meets criteria — Screened In', nextNodeId: 'safety_assessment' },
    ],
  },

  // ── 3. Screened Out ─────────────────────────────────────────────────────────

  screened_out: {
    id: 'screened_out', x: 1000, y: 600, category: 'neutral',
    title: 'Call Screened Out',
    description:
      'The SCR operator determined the report did not meet the statutory criteria. No investigation will occur — this time. However, anyone may call again at any moment. Repeat reports substantially increase the likelihood of a full investigation, regardless of their merit.',
    icon: <XCircle className="w-8 h-8 md:w-12 md:h-12 text-neutral-400" />,
    choices: [],
  },

  // ── 4. Safety Assessment ────────────────────────────────────────────────────

  safety_assessment: {
    id: 'safety_assessment', x: 1650, y: 2000, category: 'neutral',
    title: 'Safety Assessment',
    description:
      'A caseworker arrives — often unannounced — within 24 hours to 7 days of the report. Using the FAR Screening Tool, they assess whether your family qualifies for the supportive CARES track or must face a punitive Traditional Investigation. The caseworker has wide discretion in this determination.',
    icon: <Shield className="w-8 h-8 md:w-12 md:h-12 text-amber-500" />,
    statistics: SAFETY_ASSESSMENT_STATISTICS,
    choices: [
      { text: 'Assessed as safe — routed to CARES supportive track', nextNodeId: 'cares_track' },
      { text: 'Danger identified — routed to traditional investigation', nextNodeId: 'investigation' },
    ],
  },

  // ── 5. CARES Track ──────────────────────────────────────────────────────────

  cares_track: {
    id: 'cares_track', x: 2300, y: 800, category: 'cares',
    title: 'CARES — Supportive Track',
    description:
      'Your case is classified as CARES (Collaborative Assessment, Response, Engagement & Support). ACS presents this as a "voluntary," family-led process. A caseworker will conduct scheduled home visits, develop a service plan with you, and monitor your progress over roughly 60 days. Completing the plan closes the case.',
    icon: <Handshake className="w-8 h-8 md:w-12 md:h-12 text-green-500" />,
    statistics: CARES_TRACK_STATISTICS,
    choices: [
      { text: 'Refused participation — escalated to investigation', nextNodeId: 'investigation' },
    ],
  },

  // ── 6. ACS Investigation ────────────────────────────────────────────────────

  investigation: {
    id: 'investigation', x: 2300, y: 2000, category: 'investigation',
    title: 'ACS Investigation',
    description:
      'A CPS caseworker is assigned and must begin within 24 hours. Over the following 60 days, they will conduct unannounced home visits, inspect living conditions, interview your children alone without your presence, contact their school, and potentially order drug tests. You have no right to an attorney at this stage.',
    icon: <EyeOff className="w-8 h-8 md:w-12 md:h-12 text-red-500" />,
    statistics: INVESTIGATION_STATISTICS,
    choices: [
      { text: 'Investigation concludes — finding issued', nextNodeId: 'determination' },
    ],
  },

  // ── 7. Determination ────────────────────────────────────────────────────────

  determination: {
    id: 'determination', x: 2950, y: 2000, category: 'investigation',
    title: 'Investigation Finding',
    description:
      'After 60 days, the ACS caseworker files their report. Every case is classified as either "Unfounded" — insufficient evidence of maltreatment — or "Indicated" — meaning ACS believes maltreatment occurred. The threshold for "Indicated" is not proof beyond a reasonable doubt; it requires only "some credible evidence."',
    icon: <Scale className="w-8 h-8 md:w-12 md:h-12 text-neutral-600" />,
    statistics: DETERMINATION_STATISTICS,
    choices: [
      { text: '"Unfounded" — insufficient evidence, case closed', nextNodeId: 'unsubstantiated' },
      { text: '"Indicated" — ACS pursues case plan or court', nextNodeId: 'case_plan' },
    ],
  },

  // ── 8. Unsubstantiated ──────────────────────────────────────────────────────

  unsubstantiated: {
    id: 'unsubstantiated', x: 2950, y: 700, category: 'neutral',
    title: 'Case Closed — Unfounded',
    description:
      'After 60 days of investigation, ACS found insufficient evidence of maltreatment. The case is marked "Unfounded" and closed. You may be offered optional community-based services. The investigation is over — but the trauma of surveillance, unannounced home visits, and your children being questioned cannot be undone.',
    icon: <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-neutral-500" />,
    choices: [],
  },

  // ── 9. Case Plan ────────────────────────────────────────────────────────────

  case_plan: {
    id: 'case_plan', x: 3600, y: 2000, category: 'investigation',
    title: 'Voluntary Service Agreement',
    description:
      'ACS offers a "voluntary" service plan: parenting classes, counseling, drug testing, housing referrals. Signing it is presented as an alternative to going to court. But it is a trap — refusing services is routinely cited as evidence of non-cooperation and used to justify filing a court petition.',
    icon: <ClipboardList className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />,
    statistics: CASE_PLAN_STATISTICS,
    choices: [
      { text: 'ACS determines court involvement is necessary', nextNodeId: 'court_filing' },
    ],
  },

  // ── 10. Court Filing ────────────────────────────────────────────────────────

  court_filing: {
    id: 'court_filing', x: 4250, y: 2000, category: 'court',
    title: 'ACS Files a Court Petition',
    description:
      'Despite your compliance, ACS files an Article 10 petition in Family Court under the Family Court Act, alleging child neglect or abuse. You receive notice — often the night before your first court date. The state is now your legal adversary. If you cannot afford a private attorney, you will be assigned one.',
    icon: <FileCheck className="w-8 h-8 md:w-12 md:h-12 text-red-600" />,
    statistics: COURT_FILING_STATISTICS,
    choices: [
      { text: 'Case proceeds to family court hearing', nextNodeId: 'court_hearing' },
    ],
  },

  // ── 11. Court Hearing ───────────────────────────────────────────────────────

  court_hearing: {
    id: 'court_hearing', x: 4900, y: 2000, category: 'court',
    title: 'Family Court Hearing',
    description:
      'The courtroom is crowded with families — almost all Black and Latino. Individual hearings often last under 30 minutes. Families frequently meet their assigned attorney for the first time minutes before their case is called. The judge will decide whether your child remains at home under supervision or is removed.',
    icon: <Scale className="w-8 h-8 md:w-12 md:h-12 text-red-700" />,
    statistics: COURT_HEARING_STATISTICS,
    choices: [
      { text: 'Judge orders supervision — child stays home', nextNodeId: 'supervision_order' },
      { text: 'Judge orders removal — child taken into ACS custody', nextNodeId: 'foster_care_removal' },
    ],
  },

  // ── 12. Supervision Order ───────────────────────────────────────────────────

  supervision_order: {
    id: 'supervision_order', x: 5550, y: 1100, category: 'court',
    title: 'Court Supervision Order',
    description:
      'Your child stays in your home — for now. The court issues a supervision order: ACS will conduct monthly home visits, you must complete all court-mandated services, and any perceived non-compliance can restart the cycle. The case will remain active until a judge agrees it is closed.',
    icon: <Home className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />,
    statistics: SUPERVISION_ORDER_STATISTICS,
    choices: [],
  },

  // ── 13. Foster Care Removal ─────────────────────────────────────────────────

  foster_care_removal: {
    id: 'foster_care_removal', x: 5550, y: 2950, category: 'court',
    title: 'Child Removed — Placed in ACS Custody',
    description:
      "The judge issues an order of placement. Your child is removed from your home and transported to an ACS intake center. You are not present during this process. From here, ACS determines where your child will live — with a relative, a foster family, or in a group home. Visitation is determined by the court.",
    icon: <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-red-800" />,
    statistics: FOSTER_CARE_REMOVAL_STATISTICS,
    choices: [
      { text: 'Relative caregiver available — kinship placement', nextNodeId: 'kinship_placement' },
      { text: 'No relative available — institutional or foster placement', nextNodeId: 'group_home' },
    ],
  },

  // ── 14. Kinship Placement ───────────────────────────────────────────────────

  kinship_placement: {
    id: 'kinship_placement', x: 6200, y: 2400, category: 'court',
    title: 'Kinship Placement',
    description:
      'Your child is placed with a relative or close family friend — a grandparent, aunt, uncle, or trusted adult known to the child. This is the legally preferred placement option. Your child is in a familiar environment, but they are still separated from you. Court-ordered visitation typically means a few supervised hours per week.',
    icon: <Heart className="w-8 h-8 md:w-12 md:h-12 text-pink-500" />,
    statistics: KINSHIP_PLACEMENT_STATISTICS,
    choices: [],
  },

  // ── 15. Group Home / Congregate Care ────────────────────────────────────────

  group_home: {
    id: 'group_home', x: 6200, y: 3550, category: 'court',
    title: 'Foster Care or Group Home Placement',
    description:
      'No suitable family placement was identified. Your child is placed in a licensed foster home with strangers, or in congregate care — a group home or residential facility. They will attend a new school and may be placed anywhere in the five boroughs, far from your neighborhood, support network, and community.',
    icon: <Building2 className="w-8 h-8 md:w-12 md:h-12 text-red-700" />,
    statistics: GROUP_HOME_STATISTICS,
    choices: [],
  },

};

export const EDGES: Edge[] = [
  { from: 'start',               to: 'scr_screening' },
  { from: 'scr_screening',       to: 'screened_out' },
  { from: 'scr_screening',       to: 'safety_assessment' },
  { from: 'safety_assessment',   to: 'cares_track' },
  { from: 'safety_assessment',   to: 'investigation' },
  { from: 'cares_track',         to: 'investigation' },
  { from: 'investigation',       to: 'determination' },
  { from: 'determination',       to: 'unsubstantiated' },
  { from: 'determination',       to: 'case_plan' },
  { from: 'case_plan',           to: 'court_filing' },
  { from: 'court_filing',        to: 'court_hearing' },
  { from: 'court_hearing',       to: 'supervision_order' },
  { from: 'court_hearing',       to: 'foster_care_removal' },
  { from: 'foster_care_removal', to: 'kinship_placement' },
  { from: 'foster_care_removal', to: 'group_home' },
];

export default STORY_NODES;
