import type { AccentColor } from '../types'

export interface BoardTemplate {
  id: string
  title: string
  category: 'Engineering' | 'Design' | 'Marketing' | 'Product management' | 'Operations'
  description: string
  accent: AccentColor
  lists: { title: string; color?: AccentColor; cards: string[] }[]
}

export const templateCategories = ['Engineering', 'Design', 'Marketing', 'Product management', 'Operations'] as const

export const boardTemplates: BoardTemplate[] = [
  {
    id: 't-kanban',
    title: 'Kanban template',
    category: 'Engineering',
    description: 'Visualise work in progress and keep it flowing from backlog to done.',
    accent: 'blue',
    lists: [
      { title: 'Backlog', cards: ['Define the first piece of work', 'Capture open questions'] },
      { title: 'To do', cards: ['Pick the highest priority card'] },
      { title: 'Doing', color: 'yellow', cards: [] },
      { title: 'Done', color: 'green', cards: [] },
    ],
  },
  {
    id: 't-scrum',
    title: 'Scrum board',
    category: 'Engineering',
    description: 'Plan sprints, run stand-ups and track the sprint goal.',
    accent: 'purple',
    lists: [
      { title: 'Product backlog', cards: ['Groom backlog items', 'Estimate stories'] },
      { title: 'Sprint backlog', cards: ['Agree on the sprint goal'] },
      { title: 'In progress', color: 'yellow', cards: [] },
      { title: 'Review', color: 'purple', cards: [] },
      { title: 'Done', color: 'green', cards: [] },
    ],
  },
  {
    id: 't-design-sprint',
    title: 'Design sprint',
    category: 'Design',
    description: 'Map, sketch, decide, prototype and test in five days.',
    accent: 'magenta',
    lists: [
      { title: 'Monday: Map', cards: ['Set the long-term goal', 'Interview experts'] },
      { title: 'Tuesday: Sketch', cards: ['Lightning demos', 'Crazy 8s'] },
      { title: 'Wednesday: Decide', cards: ['Heat map vote'] },
      { title: 'Thursday: Prototype', color: 'yellow', cards: [] },
      { title: 'Friday: Test', color: 'green', cards: ['Run five user interviews'] },
    ],
  },
  {
    id: 't-research',
    title: 'User research repository',
    category: 'Design',
    description: 'Collect studies, insights and recommendations in one place.',
    accent: 'teal',
    lists: [
      { title: 'Planned studies', cards: ['Onboarding diary study'] },
      { title: 'In field', color: 'yellow', cards: [] },
      { title: 'Synthesis', color: 'purple', cards: [] },
      { title: 'Insights', color: 'green', cards: [] },
    ],
  },
  {
    id: 't-campaign',
    title: 'Marketing campaign',
    category: 'Marketing',
    description: 'Run a launch from brief to wrap-up report.',
    accent: 'orange',
    lists: [
      { title: 'Ideas', cards: ['Brainstorm campaign angles'] },
      { title: 'Planning', cards: ['Write the brief', 'Set KPIs'] },
      { title: 'In production', color: 'yellow', cards: [] },
      { title: 'Live', color: 'green', cards: [] },
    ],
  },
  {
    id: 't-roadmap',
    title: 'Product roadmap',
    category: 'Product management',
    description: 'Share what is now, next and later with the whole company.',
    accent: 'blue',
    lists: [
      { title: 'Now', color: 'green', cards: ['Top priority initiative'] },
      { title: 'Next', color: 'yellow', cards: [] },
      { title: 'Later', cards: [] },
      { title: 'Ideas', cards: ['Collect feedback themes'] },
    ],
  },
  {
    id: 't-onboarding',
    title: 'New hire onboarding',
    category: 'Operations',
    description: 'Give new teammates a clear first 30, 60 and 90 days.',
    accent: 'lime',
    lists: [
      { title: 'Before day one', cards: ['Order laptop', 'Create accounts'] },
      { title: 'First week', cards: ['Meet the team', 'Set up dev environment'] },
      { title: 'First month', color: 'yellow', cards: [] },
      { title: 'Done', color: 'green', cards: [] },
    ],
  },
  {
    id: 't-weekly',
    title: 'Weekly planning',
    category: 'Operations',
    description: 'Sort to-dos into today, this week and later.',
    accent: 'yellow',
    lists: [
      { title: 'Today', color: 'yellow', cards: [] },
      { title: 'This week', color: 'green', cards: [] },
      { title: 'Later', cards: [] },
    ],
  },
]

export interface CardTemplate {
  id: string
  title: string
  description: string
  checklist: string[]
}

export const cardTemplates: CardTemplate[] = [
  {
    id: 'ct-bug',
    title: 'Bug report',
    description: 'Repro steps\n1. \n2. \n3. \n\nExpected:\nActual:\nBrowser and device:',
    checklist: ['Reproduce the bug', 'Identify the root cause', 'Fix and add a test', 'Verify on staging'],
  },
  {
    id: 'ct-feature',
    title: 'Feature request',
    description: 'Problem\nWho is affected and why it matters.\n\nProposal\n\nSuccess metric',
    checklist: ['Validate with customers', 'Write the spec', 'Design review', 'Ship behind a flag'],
  },
  {
    id: 'ct-design-review',
    title: 'Design review',
    description: 'Figma link:\nWhat feedback do you need?',
    checklist: ['Share in design crit', 'Accessibility check', 'Content review', 'Hand off'],
  },
]
