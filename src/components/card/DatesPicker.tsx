import { useState } from 'react'
import Button from '@atlaskit/button/new'
import AiSparkleIcon from '@atlaskit/icon/core/ai-sparkle'
import Calendar from '@atlaskit/calendar'
import { Checkbox } from '@atlaskit/checkbox'
import { cssMap, cx } from '@atlaskit/css'
import { Label } from '@atlaskit/form'
import { Box } from '@atlaskit/primitives/compiled/box'
import { Pressable } from '@atlaskit/primitives/compiled/pressable'
import { Stack } from '@atlaskit/primitives/compiled/stack'
import { Text } from '@atlaskit/primitives/compiled/text'
import Select from '@atlaskit/select'
import Textfield from '@atlaskit/textfield'
import { token } from '@atlaskit/tokens'
import VisuallyHidden from '@atlaskit/visually-hidden'
import { addDays, formatTime, fromFieldDate, parseIsoDate, toFieldDate, toIsoDate, todayIso } from '../../lib/dates'
import { useImpact } from '../../impact/ImpactProvider'
import { useDispatch } from '../../state/store'
import type { Card, CardDates, Recurrence, Reminder } from '../../types'

const styles = cssMap({
  actions: { display: 'flex', gap: token('space.100') },
  action: { flexGrow: 1, flexBasis: 0 },
  calendar: { display: 'flex', justifyContent: 'center' },
  fieldRow: { display: 'flex', alignItems: 'center', gap: token('space.100') },
  dateField: { width: '7.5rem' },
  timeField: { flexGrow: 1, minWidth: 0 },
  days: { display: 'flex', justifyContent: 'space-between', gap: token('space.050') },
  day: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    borderRadius: token('radius.full'),
    borderWidth: token('border.width'),
    borderStyle: 'solid',
    borderColor: token('color.border'),
    font: token('font.body.small'),
    color: token('color.text'),
    backgroundColor: token('color.background.neutral.subtle'),
    '&:hover': { backgroundColor: token('color.background.neutral.subtle.hovered') },
  },
  daySelected: {
    borderColor: token('color.border.selected'),
    color: token('color.text.inverse'),
    backgroundColor: token('color.background.selected.bold'),
    '&:hover': { backgroundColor: token('color.background.selected.bold.hovered') },
  },
})

const recurrenceOptions: { label: string; value: Recurrence }[] = [
  { label: 'None', value: 'never' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays', value: 'weekdays' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const reminderOptions: { label: string; value: Reminder }[] = [
  { label: 'None', value: 'none' },
  { label: 'At time of due date', value: 'at-time' },
  { label: '5 Minutes before', value: '5m' },
  { label: '10 Minutes before', value: '10m' },
  { label: '15 Minutes before', value: '15m' },
  { label: '1 Hour before', value: '1h' },
  { label: '2 Hours before', value: '2h' },
  { label: '1 Day before', value: '1d' },
  { label: '2 Days before', value: '2d' },
]

const WEEKDAYS = [
  { short: 'S', name: 'Sunday' },
  { short: 'M', name: 'Monday' },
  { short: 'T', name: 'Tuesday' },
  { short: 'W', name: 'Wednesday' },
  { short: 'T', name: 'Thursday' },
  { short: 'F', name: 'Friday' },
  { short: 'S', name: 'Saturday' },
]

function timeOptions(current?: string) {
  const values = new Set(Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`))
  if (current) values.add(current)
  return Array.from(values)
    .sort()
    .map((value) => ({ label: formatTime(value), value }))
}

function datesBetween(start: string, end: string) {
  const out: string[] = []
  for (let d = parseIsoDate(start); toIsoDate(d) <= end && out.length < 400; d = addDays(d, 1)) out.push(toIsoDate(d))
  return out
}

/** A date text field that accepts MM/DD/YYYY and reports a valid ISO date on blur. */
function DateField({ id, label, value, isDisabled, onFocus, onChange }: { id: string; label: string; value?: string; isDisabled: boolean; onFocus: () => void; onChange: (iso: string) => void }) {
  const [text, setText] = useState(value ? toFieldDate(value) : '')
  const [isInvalid, setInvalid] = useState(false)
  const [lastValue, setLastValue] = useState(value)
  // Keep the text in sync when the calendar changes the date.
  if (value !== lastValue) {
    setLastValue(value)
    setText(value ? toFieldDate(value) : '')
    setInvalid(false)
  }
  return (
    <Box xcss={styles.dateField}>
      <Textfield
        id={id}
        aria-label={label}
        placeholder="M/D/YYYY"
        isCompact
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        value={text}
        onFocus={onFocus}
        onChange={(e) => setText(e.currentTarget.value)}
        onBlur={() => {
          const iso = fromFieldDate(text)
          if (iso) onChange(iso)
          else setInvalid(text.trim() !== '')
        }}
      />
    </Box>
  )
}

/** Trello's Dates popover: start and due dates, due time, recurrence and reminder, saved together. */
export function DatesPicker({ card, onDone }: { card: Card; onDone: () => void }) {
  const dispatch = useDispatch()
  const { session, startDateChange, reopenReview, cancelDraft } = useImpact()
  // A date review kept with "Keep draft and close" (or after Back to edit) reopens Dates with its proposed dates.
  const pending = session?.kind === 'date' && session.cardId === card.id && ['draft', 'checking', 'review'].includes(session.phase) ? session.dateChange : undefined
  const from: CardDates = pending?.dates ?? card
  const [hasStart, setHasStart] = useState(!!from.startDate)
  const [startDate, setStartDate] = useState(from.startDate)
  const [hasDue, setHasDue] = useState(from.dueDate !== undefined || !from.startDate)
  const [dueDate, setDueDate] = useState(from.dueDate)
  const [dueTime, setDueTime] = useState(from.dueTime ?? '12:00')
  const [recurring, setRecurring] = useState<Recurrence>(from.recurring ?? 'never')
  const [recurringDays, setRecurringDays] = useState<number[]>(from.recurringDays ?? (from.dueDate ? [parseIsoDate(from.dueDate).getDay()] : []))
  const [reminder, setReminder] = useState<Reminder>(from.reminder ?? (from.dueDate ? 'none' : '1d'))
  const [active, setActive] = useState<'start' | 'due'>(from.startDate && !from.dueDate ? 'start' : 'due')
  const initial = parseIsoDate(dueDate ?? startDate ?? todayIso())

  const dates: CardDates = {
    startDate: hasStart ? startDate : undefined,
    dueDate: hasDue ? dueDate : undefined,
    dueTime: hasDue && dueDate ? dueTime : undefined,
    recurring: hasDue && dueDate ? recurring : undefined,
    recurringDays: hasDue && dueDate && recurring === 'weekly' ? recurringDays : undefined,
    reminder: hasDue && dueDate ? reminder : undefined,
  }
  const highlighted =
    dates.startDate && dates.dueDate && dates.startDate <= dates.dueDate ? datesBetween(dates.startDate, dates.dueDate) : [dates.startDate, dates.dueDate].filter((d): d is string => !!d)
  // Save is Trello's own path and always works without Impact (spec rule 1); it ends any unsaved review of this date.
  const commit = (next: CardDates) => {
    dispatch({ type: 'card/setDates', cardId: card.id, dates: next })
    if (pending) cancelDraft()
    onDone()
  }
  const isChanged = !!dates.dueDate && dates.dueDate !== card.dueDate
  const reviewImpact = () => {
    // Unchanged proposed dates reopen the kept review; anything new is checked again.
    if (pending && session?.review && JSON.stringify(dates) === JSON.stringify(pending.dates)) reopenReview()
    else startDateChange(card.id, dates)
    onDone()
  }
  const save = () => commit(dates)

  const pick = (iso: string) => {
    if (active === 'start') {
      setHasStart(true)
      setStartDate(iso)
    } else {
      setHasDue(true)
      setDueDate(iso)
    }
  }

  return (
    <Stack space="space.150">
      <Box xcss={styles.calendar}>
        <Calendar defaultMonth={initial.getMonth() + 1} defaultYear={initial.getFullYear()} selected={highlighted} previouslySelected={[]} today={todayIso()} onSelect={(e) => pick(e.iso)} />
      </Box>

      <Stack space="space.050">
        <Label htmlFor="dates-start">Start date</Label>
        <Box xcss={styles.fieldRow}>
          <Checkbox
            isChecked={hasStart}
            label={<VisuallyHidden>Include start date</VisuallyHidden>}
            onChange={() => {
              setHasStart((v) => !v)
              if (!hasStart) {
                setActive('start')
                if (!startDate) setStartDate(todayIso())
              }
            }}
          />
          <DateField id="dates-start" label="Start date" value={hasStart ? startDate : undefined} isDisabled={!hasStart} onFocus={() => setActive('start')} onChange={setStartDate} />
        </Box>
      </Stack>

      <Stack space="space.050">
        <Label htmlFor="dates-due">Due date</Label>
        <Box xcss={styles.fieldRow}>
          <Checkbox
            isChecked={hasDue}
            label={<VisuallyHidden>Include due date</VisuallyHidden>}
            onChange={() => {
              setHasDue((v) => !v)
              if (!hasDue) {
                setActive('due')
                if (!dueDate) setDueDate(toIsoDate(addDays(new Date(), 1)))
              }
            }}
          />
          <DateField id="dates-due" label="Due date" value={hasDue ? dueDate : undefined} isDisabled={!hasDue} onFocus={() => setActive('due')} onChange={setDueDate} />
          <Box xcss={styles.timeField}>
            <Select
              inputId="dates-time"
              aria-label="Due time"
              spacing="compact"
              isDisabled={!hasDue}
              options={timeOptions(dueTime)}
              value={dueTime ? { label: formatTime(dueTime), value: dueTime } : null}
              onChange={(o) => o && setDueTime(o.value)}
            />
          </Box>
        </Box>
      </Stack>

      <Stack space="space.075">
        <Label htmlFor="dates-recurring">Recurring</Label>
        <Select
          inputId="dates-recurring"
          isDisabled={!dates.dueDate}
          options={recurrenceOptions}
          value={recurrenceOptions.find((o) => o.value === recurring)}
          onChange={(o) => o && setRecurring(o.value)}
        />
        {recurring === 'weekly' && dates.dueDate && (
          <Box xcss={styles.days} role="group" aria-label="Repeat on">
            {WEEKDAYS.map((day, i) => {
              const isOn = recurringDays.includes(i)
              return (
                <Pressable
                  key={day.name}
                  xcss={cx(styles.day, isOn && styles.daySelected)}
                  aria-pressed={isOn}
                  aria-label={day.name}
                  onClick={() => setRecurringDays((cur) => (isOn ? cur.filter((d) => d !== i) : [...cur, i].sort()))}
                >
                  {day.short}
                </Pressable>
              )
            })}
          </Box>
        )}
      </Stack>

      <Stack space="space.075">
        <Label htmlFor="dates-reminder">Set due date reminder</Label>
        <Select
          inputId="dates-reminder"
          isDisabled={!dates.dueDate}
          options={reminderOptions}
          value={reminderOptions.find((o) => o.value === reminder)}
          onChange={(o) => o && setReminder(o.value)}
        />
        <Text size="small" color="color.text.subtle">
          Reminders will be sent to all members and watchers of this card.
        </Text>
      </Stack>

      <Stack space="space.100">
        <Box xcss={styles.actions}>
          <Box xcss={styles.action}>
            <Button appearance="primary" shouldFitContainer onClick={save}>
              Save
            </Button>
          </Box>
          {/* Impact adds only this second button beside Save, for a changed due date. */}
          {isChanged && (
            <Box xcss={styles.action}>
              <Button shouldFitContainer iconBefore={AiSparkleIcon} onClick={reviewImpact}>
                Review impact
              </Button>
            </Box>
          )}
        </Box>
        <Button shouldFitContainer isDisabled={!card.dueDate && !card.startDate} onClick={() => commit({})}>
          Remove
        </Button>
      </Stack>
    </Stack>
  )
}
