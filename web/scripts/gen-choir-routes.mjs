import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const base = path.join(__dirname, '../app/(dashboard)/choir/[choirId]')

const routes = [
  'member', 'president', 'vice-president', 'music-direction', 'family-coordinator',
  'family-head', 'advisor', 'care', 'spiritual', 'budget', 'records',
  'join-requests', 'roles', 'music', 'members', 'activities', 'announcements',
  'analytics', 'assets', 'discipline', 'documents', 'families', 'finance',
  'meetings', 'public-profile', 'reports', 'scheduling', 'stewardship',
  'voice-sections', 'welfare', 'admin', 'settings', 'service-preparation',
]

for (const r of routes) {
  const dir = path.join(base, r)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'page.tsx'),
    `export { default } from '../../${r}/page'\n`,
  )
}

const nested = [
  ['music/[id]', '../../../music/[id]/page'],
  ['activities/new', '../../../activities/new/page'],
  ['attendance/[activityId]', '../../../attendance/[activityId]/page'],
  ['admin/families', '../../../admin/families/page'],
  ['service-preparation/[occurrenceId]', '../../../service-preparation/[occurrenceId]/page'],
]

for (const [d, exp] of nested) {
  const dir = path.join(base, d)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'page.tsx'), `export { default } from '${exp}'\n`)
}

console.log('Created', routes.length + nested.length, 're-export routes')
