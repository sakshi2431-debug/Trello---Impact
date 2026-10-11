/** Text pools used to give seeded cards believable details. */

export const descriptions: string[] = [
  'Context\nWe keep hearing about this in support tickets and recent interviews. Capture the current state, outline two or three options, and agree on a direction with the team.\n\nDone when\n- Findings shared in #product-design\n- Decision logged in the project brief',
  'Goal: reduce friction for new teams in their first week.\n\nStart with the existing flow in Figma, note every step that needs a decision from the user, and flag anything that could be deferred.',
  'Scope\n- Desktop and mobile web\n- Keyboard and screen reader support\n- Copy reviewed by content design\n\nOut of scope: native apps (tracked separately).',
  'Link to the research synthesis is in the attachments. Pull the top three themes into the roadmap discussion on Thursday.',
  'Acceptance criteria\n1. Works with 500+ cards without visible lag\n2. No layout shift when data loads\n3. Analytics events fire once per action',
  'This came out of the last retro. Keep the first version small, ship behind a feature flag and review usage after two weeks.',
  'Background: sales flagged this as a blocker for two enterprise deals. Align with Priya on requirements before estimating.',
  'Please keep comments on this card focused on decisions. Detailed discussion lives in the linked doc.',
  'Repro steps\n1. Open a board with several lists\n2. Drag a card quickly across lists\n3. Release near the bottom edge\n\nExpected: card lands where the indicator shows. Actual: card jumps to the top of the list.',
  'Owner to draft, then share for async review. Aim to have a version ready before the planning session.',
  'Use the existing design system components wherever possible. If something is missing, open a proposal on the Design System board first.',
  'Success metric: 10% increase in teams creating a second board within 7 days.',
]

export interface ChecklistTemplate {
  title: string
  items: string[]
}

export const checklistTemplates: ChecklistTemplate[] = [
  { title: 'Design', items: ['Review existing patterns', 'Sketch 2–3 concepts', 'Share in design crit', 'Update Figma file', 'Hand off to engineering'] },
  { title: 'Implementation', items: ['Write technical spec', 'Build behind feature flag', 'Add unit tests', 'Update Storybook', 'Request code review', 'Verify on staging'] },
  { title: 'Research', items: ['Draft discussion guide', 'Recruit 6 participants', 'Run sessions', 'Synthesise findings', 'Share readout'] },
  { title: 'QA', items: ['Test on Chrome, Safari and Firefox', 'Check keyboard navigation', 'Run screen reader pass', 'Log bugs on the board'] },
  { title: 'Launch', items: ['Final copy approved', 'Assets exported', 'Tracking links added', 'Schedule in tool', 'Notify support team'] },
  { title: 'Checklist', items: ['Confirm owner', 'Agree on timeline', 'Draft first version', 'Collect feedback', 'Publish'] },
  { title: 'Release', items: ['Changelog updated', 'Docs updated', 'Version bumped', 'Announce in #releases'] },
]

export const comments: string[] = [
  'I added a few notes from yesterday’s session. Main takeaway: people don’t notice the secondary action at all.',
  'Looks good to me. Can we double-check the empty state copy before this goes out?',
  'Moved the deadline by two days — waiting on final assets from the agency.',
  'Pairing on this tomorrow morning if anyone wants to join.',
  'The Figma link is updated with the latest version. Variants are on page 2.',
  'Heads up: this depends on the API change in the sprint board. Linking it here.',
  'Tested on Safari 17 and iOS — all good except the focus ring on the close button.',
  'Can we split this into two cards? The second half feels like a separate piece of work.',
  'Great progress! I shared the draft with the leadership team for early feedback.',
  'Spoke with support — this affects around 40 accounts, mostly on the enterprise plan.',
  'I’ll pick this up after the release is out.',
  'Added acceptance criteria to the description. Shout if anything is missing.',
  'Numbers from last week are in the attached spreadsheet.',
  'Is this still a priority for this quarter? Happy to deprioritise if not.',
  'Ran the contrast checker — two labels fail AA on white. Suggest using the darker token.',
  'Customer confirmed the fix works on their side. Closing the loop.',
  'Let’s review this in Thursday’s crit.',
  'Updated the checklist to reflect what we agreed in planning.',
  'Copy is final. Translations requested for DE and FR.',
  'Blocked until legal comes back, probably early next week.',
]

export const attachmentNames: string[] = [
  'research-synthesis.pdf',
  'wireframes-v3.fig',
  'interview-notes.docx',
  'screenshot-checkout.png',
  'api-contract.yaml',
  'q4-roadmap.key',
  'heatmap-export.csv',
  'usability-test-plan.pdf',
  'launch-brief.docx',
  'error-log.txt',
  'competitor-audit.xlsx',
  'hero-illustration.svg',
  'demo-recording.mp4',
  'brand-guidelines.pdf',
  'mobile-flows.fig',
  'metrics-dashboard.png',
]
