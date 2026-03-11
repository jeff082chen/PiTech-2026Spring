import {
  AlertTriangle,
  Scale,
  Users,
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
  Stethoscope,
  Brain,
  Handshake,
} from 'lucide-react';
import type { StoryNodes, Edge } from '../types';

// ─── Canvas Layout ───────────────────────────────────────────────────────────
// Canvas: 6700 x 4500
// X spacing: ~450px per column   Y spacing: ~400-450px per track
//
// Tracks (y):
//   400  — screened_out (dead end)
//   750  — CARES track
//  1200  — Main entry spine
//  1700  — Traditional investigation
//  1400  — Case closed / community services (unfounded branch)
//  2150  — FCA Article 10
//  1950  — Supervision sub-track
//  2600  — Foster care sub-track
//  2200  — Supervision failure / mandated preventive
//  3050  — Medical needs / placement decisions
//  3350  — Trauma decision
//  3150  — EFFC
//  3650  — Family setting decision
//  3450  — Traditional foster care
//  3950  — Residential placement

const STORY_NODES: StoryNodes = {
  // ─── 1. Initial Call & Screening ─────────────────────────────────────────

  start: {
    id: 'start', x: 300, y: 1200, category: 'hotline',
    title: 'Call to SCR Hotline',
    description:
      'Someone has made a report to the State Central Register (SCR) hotline, alleging "neglect" against your family. Reports can come from mandated reporters—teachers, doctors, hospital staff—or anonymous callers. The SCR operator must now determine whether your case qualifies to move forward.',
    icon: <ShieldAlert className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" />,
    fact: {
      title: 'Targeted Surveillance',
      content:
        'Black people make up 23% of the NYC population, yet they represent 38% of SCR reports. Disabled parents are also disproportionately targeted and monitored due to bias rather than actual parenting risk.',
    },
    choices: [{ text: 'Report is sent to SCR Screening', nextNodeId: 'scr_screening' }],
  },

  scr_screening: {
    id: 'scr_screening', x: 750, y: 1200, category: 'hotline',
    title: 'SCR Screening',
    description:
      'The SCR operator evaluates the report against New York State legal criteria. Only reports that meet all statutory conditions are "screened in" and forwarded to ACS. Reports that fall short are "screened out" and no further action is taken—at least for now.',
    icon: <Search className="w-8 h-8 md:w-12 md:h-12 text-blue-400" />,
    fact: {
      title: 'Statutory Screening Criteria',
      content:
        'To be screened in, a report must indicate: (1) a child under 18 under NY State jurisdiction; (2) a person responsible with a legal duty of care; (3) a minimum degree of care not being displayed; and (4) imminent risk of impairment. All four conditions must apply.',
    },
    choices: [
      { text: 'Report does not meet legal criteria — Screened Out', nextNodeId: 'screened_out' },
      { text: 'Report meets legal criteria — Screened In', nextNodeId: 'fork' },
    ],
  },

  screened_out: {
    id: 'screened_out', x: 750, y: 400, category: 'neutral',
    title: 'Call Screened Out',
    description:
      'The SCR operator determined the report did not meet the statutory criteria. The call is closed with no further action and your family will not hear from ACS—this time. However, anyone may call again. Repeat reports significantly increase the likelihood of a full investigation.',
    icon: <XCircle className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />,
    choices: [],
  },

  // ─── 2. Report to ACS & Safety Assessment ──────────────────────────────────

  fork: {
    id: 'fork', x: 1200, y: 1200, category: 'neutral',
    title: 'Report to ACS',
    description:
      "The report has been screened in and forwarded to the Administration for Children's Services (ACS). ACS collects information to identify and locate your child: age, sex, primary language, nature and extent of any injuries, type of alleged abuse or neglect, and any prior history of reports. Your family's information is now in the system.",
    icon: <Users className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />,
    fact: {
      title: 'Information Gathered at Intake',
      content:
        "ACS records include the child's age, sex, and primary language; nature and extent of injuries; type of abuse or neglect alleged; knowledge of prior history of abuse or neglect of the child or siblings; and any additional information that may help locate and assess the family.",
    },
    choices: [
      { text: 'ACS begins the Safety Assessment process', nextNodeId: 'safety_assessment' },
    ],
  },

  safety_assessment: {
    id: 'safety_assessment', x: 1650, y: 1200, category: 'neutral',
    title: 'Safety Assessment (24 hrs – 7 days)',
    description:
      'A caseworker must conduct a Safety Assessment within 24 hours to 7 days of the report. Using the FAR Screening Tool, they determine whether your situation qualifies for the supportive CARES track or requires a punitive Traditional Investigation. The outcome depends on whether ACS perceives any "immediate danger."',
    icon: <Shield className="w-8 h-8 md:w-12 md:h-12 text-amber-500" />,
    fact: {
      title: 'CARES Eligibility Criteria',
      content:
        'CARES (Collaborative Assessment, Response, Engagement & Support), also known as Family Assessment Response (FAR), is only available if: (1) there is no serious child abuse or maltreatment; and (2) no child is in immediate or impending danger of serious harm. Otherwise, the case is automatically routed to Traditional Investigation.',
    },
    choices: [
      {
        text: 'Immediate Danger or Mandatory Investigation — routed directly to ACS Investigation',
        nextNodeId: 'traditional_investigation',
      },
      {
        text: 'Assessed as Safe — case classified as FAR/CARES',
        nextNodeId: 'cares_entry',
      },
    ],
  },

  // ─── 3A. CARES (FAR) Track ────────────────────────────────────────────────

  cares_entry: {
    id: 'cares_entry', x: 2100, y: 750, category: 'cares',
    title: 'Classified as CARES — Family Must Agree',
    description:
      'SCR classifies your report as CARES and opens a record that will be kept for 10 years. The caseworker presents CARES as "voluntary" and "family-led." However, to enter the program you must agree to allow the caseworker into your home and to speak with your child. What do you choose?',
    icon: <Users className="w-8 h-8 md:w-12 md:h-12 text-green-500" />,
    fact: {
      title: 'False Choice (High Likelihood of Re-entry)',
      content:
        "CARES is advertised as voluntary and supportive, but if parents refuse certain demands—like a home visit—there is a high likelihood the case will be routed back into a Traditional Investigation, revealing its underlying coercive dynamics.",
    },
    choices: [
      { text: 'Agree to participate in CARES', nextNodeId: 'cares_main' },
      { text: 'Refuse to allow caseworker into your home', nextNodeId: 'traditional_investigation_loop' },
    ],
  },

  cares_main: {
    id: 'cares_main', x: 2550, y: 750, category: 'cares',
    title: 'Entering CARES',
    description:
      "You are now in the CARES program. Unlike a traditional investigation, caseworker visits are scheduled in advance, and interviews with family contacts are conducted in partnership with the family. There is no formal determination of whether child maltreatment occurred. However, ACS retains the right to switch your case back to Traditional Investigation at any time if they identify a \"new safety concern.\"",
    icon: <Users className="w-8 h-8 md:w-12 md:h-12 text-green-600" />,
    fact: {
      title: 'Surveillance Without a Verdict',
      content:
        "While CARES makes no formal finding of maltreatment, ACS still enters your family's information into the system, which is retained for 10 years. There is no formal culpability determination—but the surveillance has already begun. A single new concern can escalate the case at any point.",
    },
    choices: [{ text: 'Proceed to Family-Led Assessment', nextNodeId: 'family_led_assessment' }],
  },

  family_led_assessment: {
    id: 'family_led_assessment', x: 3000, y: 750, category: 'cares',
    title: 'Family-Led Assessment',
    description:
      "A caseworker conducts a Family-Led Assessment using the FLAG (Family-Led Assessment Guide). Together, you are supposed to identify your family's strengths, wants, concerns, and needs, and map out a plan for family stabilization. In practice, the caseworker's perspective significantly shapes what gets recorded.",
    icon: <ClipboardList className="w-8 h-8 md:w-12 md:h-12 text-teal-500" />,
    choices: [{ text: 'Proceed to Service Plan', nextNodeId: 'service_plan_cares' }],
  },

  service_plan_cares: {
    id: 'service_plan_cares', x: 3450, y: 750, category: 'cares',
    title: 'CARES Service Plan',
    description:
      'Based on the assessment, ACS develops a service plan for your family. This may include parenting sessions, counseling for stress or anxiety, child care planning with neighbors or family, enrollment in after-school programs, or referrals to local food pantries. Completion of this plan is tracked by ACS.',
    icon: <FileCheck className="w-8 h-8 md:w-12 md:h-12 text-teal-600" />,
    fact: {
      title: 'Services or Surveillance?',
      content:
        'CARES services are meant to support families, but participation is actively monitored by ACS. Failure to engage—or any new concern raised during the service period—can result in the case being escalated to Traditional Investigation, even after months of cooperation.',
    },
    choices: [
      { text: 'Complete service plan — Case closed after 60 days', nextNodeId: 'cares_success' },
    ],
  },

  cares_success: {
    id: 'cares_success', x: 3900, y: 750, category: 'cares',
    title: 'Case Closed After 60 Days',
    description:
      "You cooperated with all assessments and completed the service plan. After 60 days, your CARES case is officially closed. You may be referred to optional community-based preventive services. Although your family was not separated, you endured weeks of monitoring and home visits—and your family's record now exists in the ACS system for the next 10 years.",
    icon: <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-green-700" />,
    choices: [],
  },

  // ─── 3B. The Loop — Refusal Routes Back to Investigation ─────────────────

  traditional_investigation_loop: {
    id: 'traditional_investigation_loop', x: 2100, y: 1200, category: 'warning',
    title: "The System's Trap (Routed Back)",
    description:
      'Because you exercised your right to deny a stranger entry into your home, the system deemed you "uncooperative" or a "potential risk." Your case is immediately switched back to a punitive Traditional Investigation.',
    icon: <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-amber-500" />,
    fact: {
      title: 'False Choice (High Likelihood of Re-entry)',
      content:
        'CARES is advertised as voluntary and supportive, but if parents refuse certain demands, there is a high likelihood the case will be routed back into investigation, revealing its underlying coercive and surveillance dynamics.',
    },
    choices: [
      { text: 'Forced into Traditional Investigation', nextNodeId: 'traditional_investigation' },
    ],
  },

  // ─── 4. Traditional Investigation Track ──────────────────────────────────

  traditional_investigation: {
    id: 'traditional_investigation', x: 2550, y: 1700, category: 'investigation',
    title: 'ACS Investigation',
    description:
      "A CPS caseworker is assigned to your family within 24 hours. They conduct a home visit—inspecting your refrigerator, speaking to your child alone, visiting their school without your consent, and potentially ordering drug tests. ACS then makes a child safety determination. The question now is whether the investigator finds \"immediate danger.\"",
    icon: <EyeOff className="w-8 h-8 md:w-12 md:h-12 text-red-500" />,
    fact: {
      title: 'Confusing Poverty with Neglect',
      content:
        'Less than 5% of family court cases involve actual "abuse." Over 95% are for "neglect"—which usually means parents lack resources: food, clothing, or secure housing. Yet the system spends millions investigating them instead of providing direct support.',
    },
    choices: [
      {
        text: 'No immediate danger found — 60-day investigation begins',
        nextNodeId: 'investigation_result',
      },
      {
        text: 'Immediate danger found — ACS files a petition immediately',
        nextNodeId: 'fca_article_10',
      },
    ],
  },

  investigation_result: {
    id: 'investigation_result', x: 3000, y: 1700, category: 'investigation',
    title: 'Investigation Result: 60-Day Finding',
    description:
      'After the full 60-day investigation, the ACS caseworker files their report. Every case must be classified as either "Unfounded"—meaning insufficient evidence of maltreatment—or "Indicated"—meaning ACS determined that maltreatment occurred. An "Indicated" finding triggers escalation to Family Court.',
    icon: <Scale className="w-8 h-8 md:w-12 md:h-12 text-gray-600" />,
    fact: {
      title: "The Burden of Being 'Indicated'",
      content:
        "An \"Indicated\" finding—even one that never goes to court—stays on a parent's record and can affect employment, housing, and custody decisions for years. The threshold for \"Indicated\" is lower than a criminal standard of proof, yet the consequences can be equally severe.",
    },
    choices: [
      {
        text: 'Case found "Unfounded" — insufficient evidence of maltreatment',
        nextNodeId: 'case_closed',
      },
      {
        text: 'Case "Indicated" — ACS files petition in Family Court',
        nextNodeId: 'fca_article_10',
      },
    ],
  },

  case_closed: {
    id: 'case_closed', x: 3450, y: 1400, category: 'neutral',
    title: 'Case Closed — Unfounded',
    description:
      "After 60 agonizing days, the investigation found insufficient evidence. The case is marked \"Unfounded\" and closed. You may be offered optional, voluntary community-based services. The investigation itself may have already caused psychological trauma to your family—and your name remains in the ACS database.",
    icon: <Scale className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />,
    choices: [
      { text: 'Accept optional community-based services', nextNodeId: 'community_services' },
    ],
  },

  community_services: {
    id: 'community_services', x: 3900, y: 1400, category: 'neutral',
    title: 'Community-Based Services',
    description:
      "You are referred to optional, voluntary preventive services in your community—counseling, food pantry access, housing assistance referrals, or parenting support groups. No ACS caseworker is assigned. These are the kinds of resources that could have been offered from the very beginning, before any investigation ever began.",
    icon: <Handshake className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />,
    choices: [],
  },

  // ─── 5. FCA Article 10 — Family Court ────────────────────────────────────

  fca_article_10: {
    id: 'fca_article_10', x: 3450, y: 2150, category: 'court',
    title: 'Entering the Abyss: FCA Article 10',
    description:
      "ACS takes you to Family Court under FCA Article 10. Your family's fate is now in the hands of a judge. The judge will decide if your child can stay with you under strict court supervision—or must be forcibly removed from your home.",
    icon: <Scale className="w-8 h-8 md:w-12 md:h-12 text-red-600" />,
    fact: {
      title: 'The Process IS the Punishment',
      content:
        'Based on fieldwork and attorney interviews: Family Court hearings often last only 30 minutes, but due to inefficiencies and scheduling backlogs, the overall case duration can drag on for years. Families endure this prolonged limbo while trying to keep their jobs, housing, and sanity intact.',
    },
    choices: [
      { text: 'Court Ordered Supervision', nextNodeId: 'supervision' },
      { text: 'Child Removed into ACS Care', nextNodeId: 'foster_care' },
    ],
  },

  // ─── 6A. Supervision Track ────────────────────────────────────────────────

  supervision: {
    id: 'supervision', x: 3900, y: 1950, category: 'court',
    title: 'Court Ordered Supervision — FSU Assigned',
    description:
      "Your child remains in your home—for now. The court assigns you an FSU (Family Services Unit) specialist and places you under court-ordered supervision. You must complete all court-mandated services, which may include parenting classes, drug testing, mental health treatment, and regular check-ins. Failure to comply can result in your child being removed.",
    icon: <Users className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />,
    choices: [
      { text: 'Attempt to complete the court-mandated service plan', nextNodeId: 'court_service_plan' },
    ],
  },

  court_service_plan: {
    id: 'court_service_plan', x: 4350, y: 1950, category: 'court',
    title: 'Court-Mandated Service Plan',
    description:
      'You work through the court-mandated services assigned to you—attending every class, submitting to every test, appearing at every scheduled court date. Completion determines whether the court considers your case resolved or continues to escalate. Did you successfully complete all requirements?',
    icon: <FileCheck className="w-8 h-8 md:w-12 md:h-12 text-orange-600" />,
    fact: {
      title: 'Years in Limbo',
      content:
        'Court hearings often last only 30 minutes, but the overall case can drag on for years due to scheduling delays, ever-expanding service requirements, and bureaucratic backlog. Each missed appointment—even for a legitimate reason like work—can be held against you.',
    },
    choices: [
      { text: 'Successful completion of all court mandates', nextNodeId: 'supervision_success' },
      { text: 'Failure to meet court order requirements', nextNodeId: 'supervision_failure' },
    ],
  },

  supervision_success: {
    id: 'supervision_success', x: 4800, y: 1700, category: 'court',
    title: 'Court Supervision Successfully Completed',
    description:
      "You completed every requirement—every class, every drug test, every appointment. The court closes your case. Your family survived the system, but the emotional toll of missed work, public scrutiny, and years of mandatory compliance cannot be undone.",
    icon: <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-green-600" />,
    choices: [],
  },

  supervision_failure: {
    id: 'supervision_failure', x: 4800, y: 2200, category: 'court',
    title: 'Failed to Meet Court Order',
    description:
      "Despite your efforts, you could not complete all court-mandated requirements—perhaps due to work conflicts, transportation barriers, or inability to afford co-pays for required services. The court refers you to Mandated Preventive Services. This is not voluntary. Continued non-compliance could still result in your child's removal.",
    icon: <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-orange-600" />,
    choices: [
      { text: 'Referred to Mandated Preventive Services', nextNodeId: 'mandated_preventive' },
    ],
  },

  mandated_preventive: {
    id: 'mandated_preventive', x: 5250, y: 2200, category: 'court',
    title: 'Mandated Preventive Services',
    description:
      'You are enrolled in intensive, court-ordered preventive services. These include: (1) Intensive Home-Based Family Preservation Services—short-term crisis intervention with 24/7 caseworker availability; (2) Preventive Housing Services—financial assistance for families at risk of losing their housing; and (3) Respite Care—temporary childcare relief for parents under acute stress.',
    icon: <Handshake className="w-8 h-8 md:w-12 md:h-12 text-red-500" />,
    fact: {
      title: 'What Prevention Actually Looks Like',
      content:
        'Mandated preventive services can be genuinely helpful—but they are involuntary and intrusive. Caseworkers may be in the home multiple times per week. Families whose core problem is poverty, not parenting, are enrolled in intensive surveillance-driven programs rather than simply receiving direct financial support.',
    },
    choices: [],
  },

  // ─── 6B. Child Removal & Placement Track ─────────────────────────────────

  foster_care: {
    id: 'foster_care', x: 3900, y: 2600, category: 'court',
    title: 'Order of Placement: Child Removed',
    description:
      "The judge issues an order of placement. Your child is forcibly removed from your care and taken into ACS custody. They are transported to Nicholas Scoppetta Children's Center (NSCC) for an intake assessment. From there, the system determines where your child goes. You are not present for this process.",
    icon: <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-red-800" />,
    fact: {
      title: 'The High Cost of Separation',
      content:
        '52% of children removed in NYC are Black. The foster care system costs billions annually—on agency fees, payments to foster families, legal costs, and caseworker salaries. Studies show that providing direct financial support to struggling families costs a fraction of this amount and produces far better outcomes for children.',
    },
    choices: [
      { text: "Child enters placement assessment at NSCC", nextNodeId: 'placement_decision' },
    ],
  },

  placement_decision: {
    id: 'placement_decision', x: 4350, y: 2600, category: 'court',
    title: 'Placement Decision: Kinship Available?',
    description:
      "At Nicholas Scoppetta Children's Center (NSCC), ACS and the court determine the most appropriate placement for your child. The first question: is there a family member or close family friend—a \"kinship\" caregiver—who has been approved to take your child? Kinship care is the legally preferred placement option.",
    icon: <Heart className="w-8 h-8 md:w-12 md:h-12 text-pink-500" />,
    choices: [
      { text: 'Yes — kinship caregiver is available and approved', nextNodeId: 'kinship_foster_care' },
      { text: 'No — no suitable kinship caregiver identified', nextNodeId: 'medical_needs_decision' },
    ],
  },

  kinship_foster_care: {
    id: 'kinship_foster_care', x: 4800, y: 2600, category: 'court',
    title: 'Kinship Foster Care (Preferred Placement)',
    description:
      'Your child is placed with a relative or close family friend—a grandparent, aunt, uncle, or trusted family friend known to the child. This is the legally preferred placement under New York law. While your child remains separated from you, they are in a familiar environment. Visitation is permitted, but only under court-determined conditions.',
    icon: <Heart className="w-8 h-8 md:w-12 md:h-12 text-pink-600" />,
    fact: {
      title: 'Kinship Is Preferred—But Not Always Accessible',
      content:
        'Kinship placement keeps children connected to their community and culture. However, kinship caregivers often receive less financial support and fewer services than licensed foster families. Approval processes can also disqualify willing family members on technical grounds—leaving children in stranger care unnecessarily.',
    },
    choices: [],
  },

  medical_needs_decision: {
    id: 'medical_needs_decision', x: 4800, y: 3050, category: 'court',
    title: 'Does Your Child Have Complex Medical Needs?',
    description:
      "ACS evaluates your child's health and developmental profile at NSCC. Children with significant medical conditions require foster families with specialized training and resources—not all licensed foster homes are equipped to provide this level of care.",
    icon: <Stethoscope className="w-8 h-8 md:w-12 md:h-12 text-blue-600" />,
    choices: [
      { text: 'Yes — child has complex medical needs', nextNodeId: 'specialized_foster_care' },
      { text: 'No — no complex medical needs identified', nextNodeId: 'trauma_decision' },
    ],
  },

  specialized_foster_care: {
    id: 'specialized_foster_care', x: 5250, y: 2800, category: 'court',
    title: 'Specialized / Medical Foster Care',
    description:
      'Your child is placed in a foster home with a caregiver specifically trained and certified to provide medical care. These placements are rarer and may require your child to be placed further from your neighborhood or support network, making regular visitation significantly more difficult.',
    icon: <Stethoscope className="w-8 h-8 md:w-12 md:h-12 text-blue-700" />,
    choices: [],
  },

  trauma_decision: {
    id: 'trauma_decision', x: 5250, y: 3350, category: 'court',
    title: 'Significant Trauma or Behavioral Needs?',
    description:
      'ACS assesses whether your child has experienced significant trauma or has complex behavioral or emotional needs—conditions that are common outcomes of the removal process itself. Children who exhibit these needs require Enhanced Family Foster Care (EFFC), which provides specialized therapeutic support.',
    icon: <Brain className="w-8 h-8 md:w-12 md:h-12 text-purple-600" />,
    choices: [
      { text: 'Yes — significant trauma or behavioral needs identified', nextNodeId: 'effc' },
      { text: 'No — no significant trauma or behavioral needs', nextNodeId: 'family_setting_decision' },
    ],
  },

  effc: {
    id: 'effc', x: 5700, y: 3150, category: 'court',
    title: 'Enhanced Family Foster Care (EFFC)',
    description:
      "Your child is placed in an Enhanced Family Foster Care setting—a foster home where the caregiver has received additional training in trauma-informed care and therapeutic techniques. EFFC provides more intensive support, but your child is still in a stranger's home, separated from you.",
    icon: <Brain className="w-8 h-8 md:w-12 md:h-12 text-purple-700" />,
    fact: {
      title: 'Trauma Compounded by Removal',
      content:
        'Research consistently shows that the act of removal itself is traumatic for children—often more so than the situation that prompted the report. EFFC addresses trauma that the system itself caused. The removal was frequently a response to poverty, not abuse.',
    },
    choices: [],
  },

  family_setting_decision: {
    id: 'family_setting_decision', x: 5700, y: 3650, category: 'court',
    title: 'Can Your Child Be Placed in a Family Setting?',
    description:
      "ACS evaluates whether a traditional family foster home is appropriate. A family setting—a private home with a licensed foster parent—is strongly preferred over institutional or congregate care for children's wellbeing and long-term developmental outcomes.",
    icon: <Home className="w-8 h-8 md:w-12 md:h-12 text-orange-500" />,
    choices: [
      { text: 'Yes — traditional family foster home is viable', nextNodeId: 'traditional_foster_care_node' },
      { text: 'No — no suitable family setting identified', nextNodeId: 'residential_placement' },
    ],
  },

  traditional_foster_care_node: {
    id: 'traditional_foster_care_node', x: 6150, y: 3450, category: 'court',
    title: 'Traditional Foster Care (Private Residence)',
    description:
      "Your child is placed in a licensed foster family's private home. The foster family is compensated by the state. Your child will attend a new school, live with strangers, and may be placed anywhere in the five boroughs. Visitation with you is determined by the court—typically a few supervised hours per week.",
    icon: <Home className="w-8 h-8 md:w-12 md:h-12 text-orange-600" />,
    fact: {
      title: 'The Economics of Foster Care',
      content:
        "New York City spends tens of thousands of dollars per child per year on foster care—agency fees, foster family payments, legal costs, and caseworker salaries. Studies show that providing direct financial support to struggling families costs a fraction of this, and produces far better outcomes for children.",
    },
    choices: [],
  },

  residential_placement: {
    id: 'residential_placement', x: 6150, y: 3950, category: 'court',
    title: 'Residential Placement (Group Home)',
    description:
      'No suitable family foster home was identified for your child. They are placed in a congregate care facility—a group home or residential placement. Research consistently shows that children in residential placements face worse outcomes than those in family-based care. Your child is now in an institutional setting, removed from any support network.',
    icon: <Building2 className="w-8 h-8 md:w-12 md:h-12 text-red-700" />,
    fact: {
      title: 'Congregate Care: A Last Resort Used Too Often',
      content:
        "New York has been under federal scrutiny for over-use of congregate care. Studies show children in group homes face higher rates of re-entry into foster care, worse mental health outcomes, and greater risk of homelessness upon aging out of the system—compared to children placed with families.",
    },
    choices: [],
  },
};

export const EDGES: Edge[] = [
  { from: 'start', to: 'scr_screening' },
  { from: 'scr_screening', to: 'screened_out' },
  { from: 'scr_screening', to: 'fork' },
  { from: 'fork', to: 'safety_assessment' },
  { from: 'safety_assessment', to: 'cares_entry' },
  { from: 'safety_assessment', to: 'traditional_investigation' },
  { from: 'cares_entry', to: 'cares_main' },
  { from: 'cares_entry', to: 'traditional_investigation_loop' },
  { from: 'cares_main', to: 'family_led_assessment' },
  { from: 'family_led_assessment', to: 'service_plan_cares' },
  { from: 'service_plan_cares', to: 'cares_success' },
  { from: 'traditional_investigation_loop', to: 'traditional_investigation' },
  { from: 'traditional_investigation', to: 'investigation_result' },
  { from: 'traditional_investigation', to: 'fca_article_10' },
  { from: 'investigation_result', to: 'case_closed' },
  { from: 'investigation_result', to: 'fca_article_10' },
  { from: 'case_closed', to: 'community_services' },
  { from: 'fca_article_10', to: 'supervision' },
  { from: 'fca_article_10', to: 'foster_care' },
  { from: 'supervision', to: 'court_service_plan' },
  { from: 'court_service_plan', to: 'supervision_success' },
  { from: 'court_service_plan', to: 'supervision_failure' },
  { from: 'supervision_failure', to: 'mandated_preventive' },
  { from: 'foster_care', to: 'placement_decision' },
  { from: 'placement_decision', to: 'kinship_foster_care' },
  { from: 'placement_decision', to: 'medical_needs_decision' },
  { from: 'medical_needs_decision', to: 'specialized_foster_care' },
  { from: 'medical_needs_decision', to: 'trauma_decision' },
  { from: 'trauma_decision', to: 'effc' },
  { from: 'trauma_decision', to: 'family_setting_decision' },
  { from: 'family_setting_decision', to: 'traditional_foster_care_node' },
  { from: 'family_setting_decision', to: 'residential_placement' },
];

export default STORY_NODES;
