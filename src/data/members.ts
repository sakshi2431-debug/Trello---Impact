import type { Member, Workspace } from '../types'

export const workspace: Workspace = {
  id: 'ws-lumen',
  name: 'Lumen Product Team',
  shortName: 'lumenproduct',
  description: 'Product design and engineering for the Lumen web and mobile apps.',
  visibility: 'private',
}

export const CURRENT_USER_ID = 'm-maya'

export const members: Member[] = [
  { id: 'm-maya', fullName: 'Alex Chen', username: 'alexchen', email: 'alex.chen@lumen.example', role: 'Project Lead' },
  { id: 'm-jordan', fullName: 'Jordan Alvarez', username: 'jordanalvarez', email: 'jordan.alvarez@lumen.example', role: 'Engineering Manager' },
  { id: 'm-priya', fullName: 'Priya Natarajan', username: 'priyan', email: 'priya.natarajan@lumen.example', role: 'Product Manager' },
  { id: 'm-sam', fullName: 'Sam Okafor', username: 'samokafor', email: 'sam.okafor@lumen.example', role: 'Frontend Engineer' },
  { id: 'm-elena', fullName: 'Elena Petrova', username: 'elenapetrova', email: 'elena.petrova@lumen.example', role: 'UX Researcher' },
  { id: 'm-marcus', fullName: 'Marcus Lee', username: 'marcuslee', email: 'marcus.lee@lumen.example', role: 'Backend Engineer' },
  { id: 'm-aisha', fullName: 'Aisha Rahman', username: 'aisharahman', email: 'aisha.rahman@lumen.example', role: 'Content Designer' },
  { id: 'm-tomas', fullName: 'Tomás García', username: 'tomasgarcia', email: 'tomas.garcia@lumen.example', role: 'iOS Engineer' },
  { id: 'm-hannah', fullName: 'Hannah Becker', username: 'hannahbecker', email: 'hannah.becker@lumen.example', role: 'QA Engineer' },
  { id: 'm-leo', fullName: 'Leo Fischer', username: 'leofischer', email: 'leo.fischer@lumen.example', role: 'Marketing Lead' },
  { id: 'm-morgan', fullName: 'Morgan Reyes', username: 'morganreyes', email: 'morgan.reyes@lumen.example', role: 'Web Lead' },
  { id: 'm-ana', fullName: 'Ana Costa', username: 'anacosta', email: 'ana.costa@lumen.example', role: 'Release Manager' },
]

export const membersById: Record<string, Member> = Object.fromEntries(members.map((m) => [m.id, m]))
