import type { StoryConfig } from '../types';

/**
 * ─── Story Config Schema ──────────────────────────────────────────────────────
 *
 * This file defines one character's journey through the family policing system.
 * It is JSON-serializable — no JSX, no React imports.
 *
 * To add a new story:
 *   1. Copy this file (e.g. src/data/joseStory.ts).
 *   2. Change `id` to a unique string.
 *   3. Update `character`, `intro`, and `ending`.
 *   4. Set `path[]` to an ordered list of node IDs from storyNodes.tsx.
 *      Valid IDs: start, scr_screening, screened_out, safety_assessment,
 *      cares_track, investigation, determination, unsubstantiated,
 *      case_plan, court_filing, court_hearing, supervision_order,
 *      foster_care_removal, kinship_placement, group_home
 *   5. Add a `nodeContent[nodeId]` entry for each node in your path.
 *   6. Import and pass to <StoryPage storyConfig={...}> in App.tsx.
 *
 * ─── StoryConfig fields ───────────────────────────────────────────────────────
 *
 *   id            Unique identifier for this story (e.g. 'maria').
 *   title         Human-readable title (e.g. "Maria's Story").
 *   character     name: displayed as the hero headline.
 *                 summary: 1–2 sentence character introduction.
 *   intro         title: shown in the overview phase label.
 *                 description: shown below summary on the hero screen.
 *   path[]        Ordered list of nodeIds this character navigates.
 *                 Must reference valid IDs from storyNodes.tsx.
 *   nodeContent   Record<nodeId, { blocks[] }> — one entry per path node.
 *                 Nodes not listed here will show only the system description.
 *   ending        title + description for the end screen (optional).
 *
 * ─── StoryContentBlock types ─────────────────────────────────────────────────
 *
 *   { type: 'text',    title?: string, body: string }
 *     A paragraph with an optional bold heading above it.
 *
 *   { type: 'quote',   text: string, attribution?: string }
 *     An italic pull quote with a red left border.
 *     Attribution appears as "— Name" below the quote.
 *
 *   { type: 'callout', text: string }
 *     An amber-bordered callout box for systemic context or warnings.
 *
 *   { type: 'image',   src: string, caption?: string, alt?: string }
 *     An image with an optional italic caption. Leave src empty for a placeholder.
 *
 * Statistics (charts, counters, etc.) are separate — they live in
 * src/data/statistics.tsx and are attached to nodes in storyNodes.tsx.
 * They appear automatically as additional scroll phases after the story text.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MARIA_STORY: StoryConfig = {
  id: 'maria',
  title: "Maria's Story",

  character: {
    name: 'Maria',
    summary:
      'Maria is a single mother of two in the South Bronx, working two jobs to keep her family afloat. When a neighbor calls the hotline after overhearing her children argue, Maria\'s family is pulled into the family policing system — not because she did anything wrong, but because she was poor, Black, and living in a neighborhood under constant surveillance.',
  },

  intro: {
    title: 'A Call That Changes Everything',
    description:
      'In New York City, over 196,000 calls are made to the child abuse hotline each year. The majority of investigated families are Black or Latino. Most have done nothing wrong. This is Maria\'s story — and the story of thousands of families like hers.',
  },

  path: [
    'start',
    'scr_screening',
    'safety_assessment',
    'investigation',
    'determination',
    'case_plan',
    'court_filing',
    'court_hearing',
    'supervision_order',
  ],

  nodeContent: {
    start: {
      blocks: [
        {
          type: 'text',
          title: 'The Call',
          body: 'On a Tuesday afternoon in October, Maria comes home from her second job to find a notice on her door. An ACS caseworker has been by. Someone — she is never told who — called the hotline to report her family. Maria has not been accused of anything specific. But the investigation has already begun.',
        },
        {
          type: 'callout',
          text: 'Anonymous callers face no consequences for false or exaggerated reports. The family has no way to challenge an allegation they have never seen.',
        },
      ],
    },

    scr_screening: {
      blocks: [
        {
          type: 'text',
          title: 'Screened In',
          body: "The State Central Register accepts the report. Maria's family is now in the system. She has no right to know what was alleged or who alleged it. The caller can remain anonymous forever. A case number is assigned. A caseworker is dispatched.",
        },
        {
          type: 'quote',
          text: 'I kept asking: what exactly did they say I did? Nobody would tell me. I found out from my daughter\'s school that ACS had already called them.',
          attribution: 'Maria',
        },
      ],
    },

    safety_assessment: {
      blocks: [
        {
          type: 'text',
          title: 'The First Visit',
          body: "A caseworker knocks unannounced. She walks through Maria's apartment, opens the refrigerator, inspects the children's bedroom, and asks to speak with Maria's kids alone. Maria is not under arrest. But she has been told — implicitly — that refusing entry could lead to her children being taken. She lets the caseworker in.",
        },
        {
          type: 'quote',
          text: 'She looked in my fridge like I was hiding something. I had just gotten paid on Friday and hadn\'t gone shopping yet. I could see her writing something down.',
          attribution: 'Maria',
        },
        {
          type: 'callout',
          text: 'Families are not informed of their rights at this stage. Most do not know that a caseworker without a warrant cannot legally compel entry — and that even this protection is routinely bypassed.',
        },
      ],
    },

    investigation: {
      blocks: [
        {
          type: 'text',
          title: 'Under Investigation',
          body: "ACS determines the case warrants a full investigation. Over the next 60 days, caseworkers visit Maria's home multiple times without notice. Her children's school is contacted. Her employer receives a call. Maria's 9-year-old daughter asks her: 'Are they going to take us away?' Maria doesn't know how to answer.",
        },
        {
          type: 'quote',
          text: "My boss asked me what was going on. I didn't know what ACS had told them. I was scared of losing my job on top of everything else.",
          attribution: 'Maria',
        },
        {
          type: 'callout',
          text: "ACS is legally permitted to contact an employer, school, or third party without the family's knowledge or consent during an open investigation.",
        },
      ],
    },

    determination: {
      blocks: [
        {
          type: 'text',
          title: 'The Finding',
          body: "After two months, ACS issues its finding: 'Indicated.' There is 'some credible evidence' of neglect — the caseworker noted that Maria's refrigerator was not fully stocked on one of the unannounced visits. Maria works two jobs. She shops on weekends. Maria's name is now on the State Central Register.",
        },
        {
          type: 'callout',
          text: '"Some credible evidence" is a lower standard than civil liability, let alone criminal guilt. It is enough to mark a parent\'s record for up to 28 years.',
        },
        {
          type: 'quote',
          text: "They said I wasn't feeding my kids. My kids are healthy. I was at work. What was I supposed to do — quit?",
          attribution: 'Maria',
        },
      ],
    },

    case_plan: {
      blocks: [
        {
          type: 'text',
          title: 'Sign Here',
          body: "ACS offers Maria a 'voluntary' service plan: parenting classes twice a week, a monthly home visit, and a referral to a food pantry. The caseworker tells her it's the best way to avoid court. Maria signs. She rearranges her work schedule to make the parenting classes. She has been parenting for nine years.",
        },
        {
          type: 'quote',
          text: "I signed because I was afraid. I didn't understand what I was agreeing to. My attorney later told me that signing didn't actually protect me from going to court.",
          attribution: 'Maria',
        },
        {
          type: 'callout',
          text: "Service plans are presented as alternatives to court. In practice, they extend the period of ACS monitoring — and non-compliance with any requirement can itself be used as the basis for a court petition.",
        },
      ],
    },

    court_filing: {
      blocks: [
        {
          type: 'text',
          title: 'ACS Files Anyway',
          body: "Despite months of compliance, ACS files an Article 10 petition in Family Court. Maria receives a notice on a Thursday evening for a Monday hearing. She calls the number on the notice but cannot reach anyone. She shows up Monday not knowing what to expect, not knowing her rights, and not knowing whether she will leave the courthouse with her children.",
        },
        {
          type: 'callout',
          text: "An Article 10 petition triggers a formal legal proceeding. The family is now a respondent in a case where ACS — a state agency with full-time lawyers — is the petitioner.",
        },
        {
          type: 'quote',
          text: "I did everything they asked. I never missed a class, never missed a visit. And they still took me to court.",
          attribution: 'Maria',
        },
      ],
    },

    court_hearing: {
      blocks: [
        {
          type: 'text',
          title: 'The Courtroom',
          body: "The waiting room is full of families — almost all Black and Latino. Maria waits four hours to be called. She meets her court-appointed attorney for the first time 15 minutes before her hearing. The hearing lasts 22 minutes. A judge she has never met will decide the next chapter of her family's life.",
        },
        {
          type: 'quote',
          text: "My lawyer seemed nice but she didn't know my case. I was trying to explain everything to her in the hallway. Then they called us in.",
          attribution: 'Maria',
        },
        {
          type: 'callout',
          text: 'Court-appointed attorneys in family court are often juggling dozens of cases simultaneously. Families may meet their attorney for the first time on the day of their hearing.',
        },
      ],
    },

    supervision_order: {
      blocks: [
        {
          type: 'text',
          title: 'Home, But Not Free',
          body: "The judge orders supervision. Maria's children can stay with her — for now. ACS will visit monthly. Maria must continue the parenting classes, submit to drug testing, and appear for court dates every six weeks. One missed appointment, one reported concern, and the cycle begins again. Maria goes home. She hugs her kids. She does not feel safe.",
        },
        {
          type: 'quote',
          text: "I was relieved they weren't taken. But I also knew it wasn't over. It's never really over. You're always waiting for the next knock.",
          attribution: 'Maria',
        },
        {
          type: 'callout',
          text: "Maria's case was eventually closed — fourteen months after that first knock on her door. Her children were never in danger. The original report was never substantiated. The record remains.",
        },
      ],
    },
  },

  ending: {
    title: 'The System Stays',
    description:
      "Maria's case is eventually closed — fourteen months after that first knock on her door. Her children were never in danger. The original report was never substantiated. But the record of her investigation remains on the State Central Register. The trauma of fourteen months of surveillance remains. And somewhere in the Bronx tonight, another family is receiving a knock at their door.",
    actions: [
      'Support The Bronx Defenders and families facing family policing',
      'Advocate for direct financial support to families in poverty',
      'Demand accountability and reform at the State Central Register',
    ],
  },
};
