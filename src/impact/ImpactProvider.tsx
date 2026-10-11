import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createId } from '../lib/random'
import { useAppState, useDispatch } from '../state/store'
import type { CardDates } from '../types'
import { analyzeDateChange, analyzeDraft, timingQuestion } from './scenarios'
import { PRIMARY_ACTION_ID, type CommentProposal, type ExecutionStatus, type ImpactSession, type Outcome, type TimingAssumptions } from './types'

interface ImpactApi {
  session: ImpactSession | null
  /** Stages a new card from the list composer and starts reviewing its impact. */
  startDraft: (listId: string, title: string) => string
  /** Starts reviewing an unsaved due-date change from the Dates popover. */
  startDateChange: (cardId: string, dates: CardDates) => void
  /** Edits the proposed date in a date review; proposals are re-checked against it. */
  setProposedDate: (to: string) => void
  updateTiming: (id: string, patch: Partial<Pick<TimingAssumptions, 'workingDays' | 'countWeekends'>>) => void
  review: () => void
  backToDraft: () => void
  /** The ordinary Trello path: add the drafted card, or save the date, without any Impact actions. */
  addWithoutReview: () => void
  updateProposal: (id: string, patch: Partial<Pick<CommentProposal, 'text' | 'isTextEdited' | 'isSelected' | 'isSkipped'>>) => void
  apply: () => Promise<void>
  retry: (actionId: string) => Promise<void>
  checkStatus: (actionId: string) => void
  setSourceCard: (cardId: string | undefined) => void
  discardDraft: () => void
  /** Closes a finished review. */
  finish: () => void
}

const ImpactContext = createContext<ImpactApi | null>(null)

const STEP_MS = 450
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Example draft text for the scripted scenario, so a facilitator only has to type the title. */
function scenarioDescription(title: string) {
  return /accessib/i.test(title) ? 'Review keyboard navigation and screen reader support before Website Launch.' : ''
}

/**
 * Holds the in-session Impact review: one draft, its proposals and the outcome of each approved action.
 * Nothing here is persisted; durable review history is out of scope.
 */
export function ImpactProvider({ children }: { children: ReactNode }) {
  const state = useAppState()
  const dispatch = useDispatch()
  const [session, setSession] = useState<ImpactSession | null>(null)
  const stateRef = useRef(state)
  const sessionRef = useRef(session)
  useEffect(() => {
    stateRef.current = state
    sessionRef.current = session
  })

  const setOutcome = useCallback((actionId: string, outcome: Outcome) => {
    setSession((s) => (s ? { ...s, outcomes: { ...s.outcomes, [actionId]: outcome } } : s))
  }, [])

  const runAnalysis = useCallback((cardId: string) => {
    setSession((s) => (s ? { ...s, phase: 'analyzing' } : s))
    setTimeout(() => {
      const card = stateRef.current.cards[cardId]
      const current = sessionRef.current
      if (!card || !current || current.cardId !== cardId) return
      const fresh =
        current.kind === 'date' && current.dateChange ? analyzeDateChange(stateRef.current, card, current.dateChange) : analyzeDraft(stateRef.current, card)
      setSession((s) => {
        if (!s || s.cardId !== cardId) return s
        // Returning to the draft keeps staged edits to proposals that still apply.
        const previous = new Map(s.review?.proposals.map((p) => [p.id, p]))
        const proposals = fresh.proposals.map((p) => {
          const kept = previous.get(p.id)
          if (!kept) return p
          // Edited timing assumptions survive, re-anchored to the latest proposed date.
          const timing = kept.timing && p.timing ? { ...p.timing, workingDays: kept.timing.workingDays, countWeekends: kept.timing.countWeekends } : p.timing
          const text = kept.isTextEdited ? kept.text : timing ? timingQuestion(timing) : kept.text
          return { ...p, text, timing, isTextEdited: kept.isTextEdited, isSelected: kept.isSelected, isSkipped: kept.isSkipped }
        })
        return { ...s, phase: 'review', review: { ...fresh, proposals } }
      })
    }, 900)
  }, [])

  const postComment = useCallback(
    (proposal: CommentProposal, simulate: 'ok' | 'fail' | 'unknown'): Outcome => {
      const commentId = createId('cm')
      if (simulate === 'fail') return { status: 'not-applied', commentId }
      dispatch({ type: 'card/addComment', cardId: proposal.connection.cardId, text: proposal.text, id: commentId })
      return { status: simulate === 'unknown' ? 'unknown' : 'applied', commentId }
    },
    [dispatch],
  )

  const runComments = useCallback(
    async (proposals: CommentProposal[]) => {
      const simulation = stateRef.current.preferences.impactSimulation
      for (const [i, proposal] of proposals.entries()) {
        setOutcome(proposal.id, { status: 'applying' })
        await wait(STEP_MS)
        const isLast = i === proposals.length - 1
        const simulate = isLast && simulation === 'comment-fails' ? 'fail' : isLast && simulation === 'outcome-unknown' ? 'unknown' : 'ok'
        setOutcome(proposal.id, postComment(proposal, simulate))
      }
    },
    [postComment, setOutcome],
  )

  const runPrimary = useCallback(
    async (s: ImpactSession, shouldFail: boolean) => {
      setOutcome(PRIMARY_ACTION_ID, { status: 'applying' })
      await wait(STEP_MS)
      if (shouldFail) {
        setOutcome(PRIMARY_ACTION_ID, { status: 'not-applied' })
        return false
      }
      if (s.kind === 'date' && s.dateChange) dispatch({ type: 'card/setDates', cardId: s.cardId, dates: s.dateChange.dates })
      else dispatch({ type: 'card/commitDraft', cardId: s.cardId })
      setOutcome(PRIMARY_ACTION_ID, { status: 'applied' })
      return true
    },
    [dispatch, setOutcome],
  )

  const api = useMemo<ImpactApi>(
    () => ({
      session,
      startDraft: (listId, title) => {
        const id = createId('c')
        dispatch({ type: 'card/createDraft', id, listId, title, description: scenarioDescription(title) })
        setSession({ kind: 'new-card', cardId: id, phase: 'draft', outcomes: {} })
        runAnalysis(id)
        return id
      },
      startDateChange: (cardId, dates) => {
        const card = stateRef.current.cards[cardId]
        if (!card || !dates.dueDate) return
        // Returning from "Back to edit" keeps the earlier review, so edits to its suggestions carry over.
        const previous = sessionRef.current?.kind === 'date' && sessionRef.current.cardId === cardId ? sessionRef.current.review : undefined
        const next: ImpactSession = { kind: 'date', cardId, dateChange: { from: card.dueDate, to: dates.dueDate, dates }, phase: 'draft', review: previous, outcomes: {} }
        sessionRef.current = next
        setSession(next)
        runAnalysis(cardId)
      },
      setProposedDate: (to) => {
        const s = sessionRef.current
        if (!s?.dateChange) return
        const next = { ...s, dateChange: { ...s.dateChange, to, dates: { ...s.dateChange.dates, dueDate: to } } }
        sessionRef.current = next
        setSession(next)
        runAnalysis(s.cardId)
      },
      updateTiming: (id, patch) =>
        setSession((s) =>
          s?.review
            ? {
                ...s,
                review: {
                  ...s.review,
                  proposals: s.review.proposals.map((p) => {
                    if (p.id !== id || !p.timing) return p
                    const timing = { ...p.timing, ...patch }
                    return { ...p, timing, text: p.isTextEdited ? p.text : timingQuestion(timing) }
                  }),
                },
              }
            : s,
        ),
      review: () => {
        const s = sessionRef.current
        if (!s) return
        // A fresh review of a date change compares against the date saved now.
        if (s.kind === 'date' && s.dateChange) {
          const next = { ...s, dateChange: { ...s.dateChange, from: stateRef.current.cards[s.cardId]?.dueDate } }
          sessionRef.current = next
          setSession(next)
        }
        runAnalysis(s.cardId)
      },
      backToDraft: () => setSession((s) => (s ? { ...s, phase: 'draft' } : s)),
      addWithoutReview: () => {
        const s = sessionRef.current
        if (!s) return
        if (s.kind === 'date' && s.dateChange) dispatch({ type: 'card/setDates', cardId: s.cardId, dates: s.dateChange.dates })
        else dispatch({ type: 'card/commitDraft', cardId: s.cardId })
        setSession(null)
      },
      updateProposal: (id, patch) =>
        setSession((s) =>
          s?.review ? { ...s, review: { ...s.review, proposals: s.review.proposals.map((p) => (p.id === id ? { ...p, ...patch } : p)) } } : s,
        ),
      apply: async () => {
        const s = sessionRef.current
        if (!s?.review) return
        const selected = s.review.proposals.filter((p) => p.isSelected && !p.isSkipped)
        const outcomes: Record<string, Outcome> = {}
        selected.forEach((p) => (outcomes[p.id] = { status: 'not-run' }))
        setSession({ ...s, phase: 'applying', outcomes })
        const created = await runPrimary(s, stateRef.current.preferences.impactSimulation === 'create-fails')
        // Comments depend on the new card, so they are held when creation fails.
        if (created) await runComments(selected)
        setSession((cur) => (cur ? { ...cur, phase: 'results' } : cur))
      },
      retry: async (actionId) => {
        const s = sessionRef.current
        if (!s?.review) return
        if (actionId === PRIMARY_ACTION_ID) {
          const created = await runPrimary(s, false)
          const held = s.review.proposals.filter((p) => s.outcomes[p.id]?.status === 'not-run')
          if (created) await runComments(held)
          return
        }
        const proposal = s.review.proposals.find((p) => p.id === actionId)
        // Retry is offered only for actions verified as not applied, so completed work is never replayed.
        if (!proposal || s.outcomes[actionId]?.status !== 'not-applied') return
        setOutcome(actionId, { status: 'applying' })
        await wait(STEP_MS)
        setOutcome(actionId, postComment(proposal, 'ok'))
      },
      checkStatus: (actionId) => {
        const s = sessionRef.current
        const outcome = s?.outcomes[actionId]
        const proposal = s?.review?.proposals.find((p) => p.id === actionId)
        if (!outcome || !proposal) return
        const card = stateRef.current.cards[proposal.connection.cardId]
        const found = !!card?.comments.some((c) => c.id === outcome.commentId)
        const status: ExecutionStatus = found ? 'applied' : 'not-applied'
        setOutcome(actionId, { ...outcome, status })
      },
      setSourceCard: (cardId) => setSession((s) => (s ? { ...s, sourceCardId: cardId } : s)),
      discardDraft: () => {
        const s = sessionRef.current
        if (!s) return
        if (s.kind === 'new-card' && stateRef.current.cards[s.cardId]?.isDraft) dispatch({ type: 'card/delete', cardId: s.cardId })
        setSession(null)
      },
      finish: () => setSession(null),
    }),
    [session, dispatch, runAnalysis, runPrimary, runComments, postComment, setOutcome],
  )

  return <ImpactContext.Provider value={api}>{children}</ImpactContext.Provider>
}

export function useImpact() {
  const api = useContext(ImpactContext)
  if (!api) throw new Error('useImpact must be used inside ImpactProvider')
  return api
}
