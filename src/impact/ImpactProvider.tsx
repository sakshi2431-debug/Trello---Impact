import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFlags } from '@atlaskit/flag'
import StatusWarningIcon from '@atlaskit/icon/core/status-warning'
import { token } from '@atlaskit/tokens'
import { createId } from '../lib/random'
import { navigate, paths } from '../router'
import { useAppState, useDispatch } from '../state/store'
import type { AppState, Card, CardDates } from '../types'
import { isCardDone, unfinishedPrerequisites } from './dependencies'
import { joinNames, plural } from './format'
import { CHECK_MS, simulation, STEP_MS, wait } from './simulation'
import { analyzeDateChange, analyzeDescriptionEdit, analyzeDraft, timingQuestion } from './scenarios'
import { PRIMARY_ACTION_ID, type CommentProposal, type ImpactSession, type Outcome, type TimingAssumptions } from './types'

interface ImpactApi {
  session: ImpactSession | null
  /** Review impact from the list composer: stages the card as a draft and starts checking. */
  startDraft: (listId: string, title: string) => string
  /** Review impact beside Save in the Dates popover. A kept review of this card carries its edits over. */
  startDateChange: (cardId: string, dates: CardDates) => void
  /** Review impact beside Save in the description editor (Scenario 2). A kept review of this card carries its edits over. */
  startDescriptionEdit: (cardId: string, text: string) => void
  /** Typing in the description editor while a description review is kept: updates the kept text without checking. */
  setDraftDescription: (text: string) => void
  /** Edit on the change row of a description review: the new text, checked again. */
  setProposedDescription: (text: string) => void
  /** Edit on the change row of a date review: a new proposed due date, checked again. */
  setProposedDate: (to: string) => void
  /** Edit assumptions behind Why? of a date estimate. */
  updateTiming: (id: string, patch: Partial<Pick<TimingAssumptions, 'workingDays' | 'countWeekends'>>) => void
  /** Review impact from the draft popup, or again after Back to draft. Kept edits and unticked actions carry over. */
  review: () => void
  /** Reopens a kept review without checking again. */
  reopenReview: () => void
  stopChecking: () => void
  backToDraft: () => void
  /** The ordinary Trello path: add the drafted card without any Impact actions (spec rule 1). */
  addCard: () => void
  /** The draft's Cancel button: discards the draft and its review. */
  cancelDraft: () => void
  updateDraftTitle: (title: string) => void
  updateProposal: (id: string, patch: Partial<Pick<CommentProposal, 'text' | 'isSelected' | 'isTextEdited'>>) => void
  apply: () => Promise<void>
  /** Stops applying; actions that haven't started become Not run. */
  stop: () => void
  /** Re-runs the creation and every action held behind it, in order. */
  retryAll: () => Promise<void>
  /** Retries one comment that is Not applied or Not run. Never offered for Outcome unknown. */
  retry: (actionId: string) => Promise<void>
  checkStatus: (actionId: string) => void
  setSource: (source: ImpactSession['source']) => void
  /** Leaves the results; the board shows a result flag and the Impact tab keeps the later view. */
  finish: () => void
  /** A card whose popup should open on the Impact tab, set by Review impact on the early-finish flag. */
  impactTabRequest: string | null
  clearImpactTabRequest: () => void
}

const ImpactContext = createContext<ImpactApi | null>(null)

interface DoneSnapshot {
  isDone: boolean
  isComplete: boolean
  isDueComplete: boolean
  listId: string
  index: number
}

function doneSnapshots(state: AppState) {
  const map = new Map<string, DoneSnapshot>()
  for (const card of Object.values(state.cards)) {
    if (card.isDraft || card.isArchived) continue
    map.set(card.id, {
      isDone: isCardDone(state, card),
      isComplete: !!card.isComplete,
      isDueComplete: card.isDueComplete,
      listId: card.listId,
      index: state.lists[card.listId]?.cardIds.indexOf(card.id) ?? 0,
    })
  }
  return map
}


const SESSION_KEY = 'trello-impact:review'

/** The review lasts for the browser session (spec rule 8), so it survives a reload in the same tab, e.g. a demo identity switch. */
function restoreSession(cards: Record<string, { isDraft?: boolean }>): ImpactSession | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as ImpactSession | null
    // Drafts don't survive a reload, so a review of one doesn't either.
    if (!saved || !cards[saved.cardId] || cards[saved.cardId].isDraft) return null
    // A check or an apply interrupted by the reload comes back at its last settled stage.
    if (saved.phase === 'checking') return { ...saved, phase: saved.review ? 'review' : 'draft' }
    if (saved.phase === 'applying') return { ...saved, phase: 'results' }
    return saved
  } catch {
    return null
  }
}

/**
 * Holds the in-session Impact review: one draft, its proposals and the outcome of each approved action.
 * It lasts for the session only; nothing here is persisted.
 */
export function ImpactProvider({ children }: { children: ReactNode }) {
  const state = useAppState()
  const dispatch = useDispatch()
  const { showFlag } = useFlags()
  const [session, setSession] = useState<ImpactSession | null>(() => restoreSession(state.cards))
  const [impactTabRequest, setImpactTabRequest] = useState<string | null>(null)
  // What was done at the last render, so finishing a card can be noticed however it happened (circle, due date, Done list).
  const lastDone = useRef<Map<string, DoneSnapshot> | null>(null)
  const stateRef = useRef(state)
  const sessionRef = useRef(session)
  // Each check gets a token, so Stop checking (or a newer check) cancels a pending one.
  const checkToken = useRef(0)
  const stopRequested = useRef(false)
  const isFlagMuted = useRef(false)
  // A retry after a simulated failure succeeds, so recovery can be shown end to end.
  const retrying = useRef(false)
  useEffect(() => {
    stateRef.current = state
    sessionRef.current = session
  })
  useEffect(() => {
    try {
      if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
      else sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // Storage unavailable: the review still lasts until the page reloads.
    }
  }, [session])

  /**
   * A card finished before a card it depends on (approved spec exception): the completion stands, and a flag offers
   * Review impact, which opens the card's Impact tab, and Undo.
   */
  const showEarlyFinishFlag = useCallback(
    (card: Card, previous: DoneSnapshot, prerequisites: Card[]) => {
      const names = prerequisites.map((c) => c.title)
      const list = joinNames(names)
      const how =
        card.isComplete && !previous.isComplete
          ? 'marked complete'
          : card.isDueComplete && !previous.isDueComplete
            ? 'due date marked complete'
            : 'moved to Done'
      const undo = () => {
        const current = stateRef.current.cards[card.id]
        if (!current) return
        if (current.isComplete && !previous.isComplete) dispatch({ type: 'card/toggleComplete', cardId: card.id })
        if (current.isDueComplete && !previous.isDueComplete) dispatch({ type: 'card/toggleDueComplete', cardId: card.id })
        if (current.listId !== previous.listId) dispatch({ type: 'card/move', cardId: card.id, toListId: previous.listId, toIndex: previous.index })
      }
      const dismiss: () => void = showFlag({
        icon: <StatusWarningIcon label="Warning" color={token('color.icon.warning')} />,
        title: `${card.title} ${how}`,
        description: `It depends on ${list}, which ${names.length === 1 ? 'isn’t' : 'aren’t'} done yet.`,
        actions: [
          {
            content: 'Review impact',
            onClick: () => {
              setImpactTabRequest(card.id)
              navigate(paths.card(card.id, card.boardId))
              dismiss()
            },
          },
          {
            content: 'Undo',
            onClick: () => {
              undo()
              dismiss()
            },
          },
        ],
      })
    },
    [dispatch, showFlag],
  )

  useEffect(() => {
    const next = doneSnapshots(state)
    const previous = lastDone.current
    lastDone.current = next
    if (!previous) return
    for (const [id, snapshot] of next) {
      const before = previous.get(id)
      if (!before || before.isDone || !snapshot.isDone) continue
      const card = state.cards[id]
      const prerequisites = unfinishedPrerequisites(state, card).map((p) => p.card)
      if (prerequisites.length) showEarlyFinishFlag(card, before, prerequisites)
    }
  }, [state, showEarlyFinishFlag])

  const update = useCallback((next: (s: ImpactSession) => ImpactSession) => {
    setSession((s) => {
      const value = s ? next(s) : s
      sessionRef.current = value
      return value
    })
  }, [])

  const setOutcome = useCallback((actionId: string, outcome: Outcome) => update((s) => ({ ...s, outcomes: { ...s.outcomes, [actionId]: outcome } })), [update])

  const runCheck = useCallback(
    (cardId: string) => {
      const token = ++checkToken.current
      update((s) => ({ ...s, phase: 'checking' }))
      setTimeout(() => {
        const card = stateRef.current.cards[cardId]
        const current = sessionRef.current
        if (token !== checkToken.current || !card || current?.cardId !== cardId) return
        const fresh =
          current.kind === 'date' && current.dateChange
            ? analyzeDateChange(stateRef.current, card, current.dateChange)
            : current.kind === 'description' && current.descriptionChange
              ? analyzeDescriptionEdit(stateRef.current, card, current.descriptionChange)
              : analyzeDraft(stateRef.current, card)
        update((s) => {
          // Edited comments, edited assumptions and unticked actions stay with the draft for the session.
          const kept = new Map(s.review?.proposals.map((p) => [p.id, p]))
          const proposals = fresh.proposals.map((p) => {
            const previous = kept.get(p.id)
            if (!previous) return p
            const timing =
              previous.timing && p.timing ? { ...p.timing, workingDays: previous.timing.workingDays, countWeekends: previous.timing.countWeekends } : p.timing
            const text = previous.isTextEdited ? previous.text : timing ? timingQuestion(timing) : previous.text
            // A proposed After rewritten by the person is kept; otherwise it follows the latest Before.
            if (p.update)
              return { ...p, text: previous.isTextEdited ? previous.text : p.text, isTextEdited: previous.isTextEdited, isSelected: previous.isSelected }
            return { ...p, text, timing, isTextEdited: previous.isTextEdited, isSelected: previous.isSelected }
          })
          return { ...s, phase: 'review', review: { ...fresh, proposals } }
        })
      }, CHECK_MS)
    },
    [update],
  )

  /** Posts a question, or makes a confirmed edit to another card's description. */
  const postComment = useCallback(
    (proposal: CommentProposal, cardId: string, outcome: 'ok' | 'unknown'): Outcome => {
      const status = outcome === 'unknown' ? 'unknown' : 'applied'
      if (proposal.update) {
        dispatch({ type: 'card/setDescription', cardId: proposal.connection.cardId, description: proposal.text })
        return { status }
      }
      const commentId = createId('cm')
      const reviewCardId = proposal.linkCardId ?? cardId
      dispatch({ type: 'card/addComment', cardId: proposal.connection.cardId, text: proposal.text, id: commentId, impact: { reviewCardId } })
      return { status, commentId }
    },
    [dispatch],
  )

  /** Runs the creation, then each comment in order. A comment waits for the creation it depends on. */
  const run = useCallback(
    async (cardId: string, comments: CommentProposal[], includeCreate: boolean) => {
      stopRequested.current = false
      const mode = simulation()
      const markRest = (from: number, reason: Outcome['notRunReason']) =>
        comments.slice(from).forEach((p) => setOutcome(p.id, { status: 'not-run', notRunReason: reason }))
      if (includeCreate) {
        setOutcome(PRIMARY_ACTION_ID, { status: 'applying' })
        await wait(STEP_MS)
        if (mode === 'creation-failed' && !retrying.current) {
          setOutcome(PRIMARY_ACTION_ID, { status: 'not-applied' })
          markRest(0, 'dependency')
          return
        }
        const s = sessionRef.current
        if (s?.kind === 'date' && s.dateChange) dispatch({ type: 'card/setDates', cardId, dates: s.dateChange.dates })
        else if (s?.kind === 'description' && s.descriptionChange) dispatch({ type: 'card/setDescription', cardId, description: s.descriptionChange.to })
        else dispatch({ type: 'card/commitDraft', cardId })
        setOutcome(PRIMARY_ACTION_ID, { status: 'applied' })
      }
      for (const [i, proposal] of comments.entries()) {
        if (stopRequested.current) {
          markRest(i, 'stopped')
          return
        }
        setOutcome(proposal.id, { status: 'applying' })
        await wait(STEP_MS)
        const isLast = i === comments.length - 1
        setOutcome(proposal.id, postComment(proposal, cardId, isLast && mode === 'outcome-unknown' && !retrying.current ? 'unknown' : 'ok'))
      }
    },
    [dispatch, postComment, setOutcome],
  )
  const showResultFlag = useCallback(() => {
    const s = sessionRef.current
    if (!s || isFlagMuted.current) return
    const created = s.outcomes[PRIMARY_ACTION_ID]?.status === 'applied'
    const posted = Object.entries(s.outcomes).filter(([id, o]) => id !== PRIMARY_ACTION_ID && o.status === 'applied').length
    if (!created) return
    const change = s.kind === 'date' ? '1 date saved' : s.kind === 'description' ? '1 description saved' : '1 card created'
    const updates = s.review?.proposals.filter((p) => p.update && s.outcomes[p.id]?.status === 'applied').length ?? 0
    const comments = posted - updates
    const extra = [updates && `${plural(updates, 'card', 'cards')} updated`, comments && `${plural(comments, 'comment', 'comments')} posted`].filter(Boolean)
    // Flag actions don't dismiss on their own, so each one closes the flag.
    const dismiss: () => void = showFlag({
      title: [change, ...extra].join(' · '),
      description: 'Open the card and choose Impact to follow replies.',
      actions: [
        { content: 'Understood', onClick: () => dismiss() },
        {
          content: 'No thanks',
          onClick: () => {
            isFlagMuted.current = true
            dismiss()
          },
        },
      ],
    })
  }, [showFlag])

  const api = useMemo<ImpactApi>(
    () => ({
      session,
      startDraft: (listId, title) => {
        const id = createId('c')
        dispatch({ type: 'card/createDraft', id, listId, title, description: '' })
        const next: ImpactSession = { kind: 'new-card', cardId: id, phase: 'checking', outcomes: {} }
        sessionRef.current = next
        setSession(next)
        runCheck(id)
        return id
      },
      startDateChange: (cardId, dates) => {
        const card = stateRef.current.cards[cardId]
        if (!card || !dates.dueDate) return
        const current = sessionRef.current
        const kept = current?.kind === 'date' && current.cardId === cardId && current.phase !== 'done' ? current.review : undefined
        const next: ImpactSession = {
          kind: 'date',
          cardId,
          dateChange: { from: card.dueDate, to: dates.dueDate, dates },
          phase: 'checking',
          review: kept,
          outcomes: {},
        }
        sessionRef.current = next
        setSession(next)
        runCheck(cardId)
      },
      startDescriptionEdit: (cardId, text) => {
        const card = stateRef.current.cards[cardId]
        if (!card) return
        const current = sessionRef.current
        const isKept = current?.kind === 'description' && current.cardId === cardId && current.phase !== 'done'
        const next: ImpactSession = {
          kind: 'description',
          cardId,
          descriptionChange: { from: isKept ? current.descriptionChange!.from : card.description, to: text },
          phase: 'checking',
          review: isKept ? current.review : undefined,
          outcomes: {},
        }
        sessionRef.current = next
        setSession(next)
        runCheck(cardId)
      },
      setDraftDescription: (text) => update((s) => (s.descriptionChange ? { ...s, descriptionChange: { ...s.descriptionChange, to: text } } : s)),
      setProposedDescription: (text) => {
        const s = sessionRef.current
        if (!s?.descriptionChange) return
        update((cur) => ({ ...cur, descriptionChange: { ...cur.descriptionChange!, to: text } }))
        runCheck(s.cardId)
      },
      setProposedDate: (to) => {
        const s = sessionRef.current
        if (!s?.dateChange) return
        update((cur) => ({ ...cur, dateChange: { ...cur.dateChange!, to, dates: { ...cur.dateChange!.dates, dueDate: to } } }))
        runCheck(s.cardId)
      },
      updateTiming: (id, patch) =>
        update((s) =>
          s.review
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
        if (s) runCheck(s.cardId)
      },
      reopenReview: () => update((s) => (s.review ? { ...s, phase: 'review' } : s)),
      stopChecking: () => {
        checkToken.current += 1
        update((s) => ({ ...s, phase: 'draft' }))
      },
      backToDraft: () => update((s) => ({ ...s, phase: 'draft' })),
      addCard: () => {
        const s = sessionRef.current
        if (!s) return
        checkToken.current += 1
        dispatch({ type: 'card/commitDraft', cardId: s.cardId })
        setSession(null)
      },
      cancelDraft: () => {
        const s = sessionRef.current
        if (!s) return
        checkToken.current += 1
        if (stateRef.current.cards[s.cardId]?.isDraft) dispatch({ type: 'card/delete', cardId: s.cardId })
        setSession(null)
      },
      updateDraftTitle: (title) => {
        const s = sessionRef.current
        if (s && title.trim()) dispatch({ type: 'card/updateDraft', cardId: s.cardId, patch: { title: title.trim() } })
      },
      updateProposal: (id, patch) =>
        update((s) => (s.review ? { ...s, review: { ...s.review, proposals: s.review.proposals.map((p) => (p.id === id ? { ...p, ...patch } : p)) } } : s)),
      apply: async () => {
        const s = sessionRef.current
        if (!s?.review) return
        const selected = s.review.proposals.filter((p) => p.isSelected)
        const outcomes: Record<string, Outcome> = { [PRIMARY_ACTION_ID]: { status: 'waiting' } }
        selected.forEach((p) => (outcomes[p.id] = { status: 'waiting' }))
        update((cur) => ({ ...cur, phase: 'applying', outcomes }))
        retrying.current = false
        await run(s.cardId, selected, true)
        update((cur) => ({ ...cur, phase: 'results' }))
      },
      stop: () => (stopRequested.current = true),
      retryAll: async () => {
        const s = sessionRef.current
        if (!s?.review) return
        const held = s.review.proposals.filter((p) => s.outcomes[p.id]?.status === 'not-run' || s.outcomes[p.id]?.status === 'not-applied')
        update((cur) => ({ ...cur, phase: 'applying' }))
        retrying.current = true
        await run(s.cardId, held, s.outcomes[PRIMARY_ACTION_ID]?.status !== 'applied')
        retrying.current = false
        update((cur) => ({ ...cur, phase: 'results' }))
      },
      retry: async (actionId) => {
        const s = sessionRef.current
        const proposal = s?.review?.proposals.find((p) => p.id === actionId)
        const status = s?.outcomes[actionId]?.status
        // Only actions verified as not applied, or never run, are retried, so nothing posts twice.
        if (!s || !proposal || (status !== 'not-applied' && status !== 'not-run')) return
        if (s.outcomes[PRIMARY_ACTION_ID]?.status !== 'applied') return
        setOutcome(actionId, { status: 'applying' })
        await wait(STEP_MS)
        setOutcome(actionId, postComment(proposal, s.cardId, 'ok'))
      },
      checkStatus: (actionId) => {
        const s = sessionRef.current
        const outcome = s?.outcomes[actionId]
        const proposal = s?.review?.proposals.find((p) => p.id === actionId)
        if (!outcome || !proposal) return
        const target = stateRef.current.cards[proposal.connection.cardId]
        const found = proposal.update ? target?.description === proposal.text : !!target?.comments.some((c) => c.id === outcome.commentId)
        setOutcome(actionId, { ...outcome, status: found ? 'applied' : 'not-applied' })
      },
      setSource: (source) => update((s) => ({ ...s, source })),
      finish: () => {
        update((s) => ({ ...s, phase: 'done' }))
        showResultFlag()
      },
      impactTabRequest,
      clearImpactTabRequest: () => setImpactTabRequest(null),
    }),
    [impactTabRequest, session, dispatch, runCheck, run, postComment, setOutcome, update, showResultFlag],
  )

  return <ImpactContext.Provider value={api}>{children}</ImpactContext.Provider>
}

export function useImpact() {
  const api = useContext(ImpactContext)
  if (!api) throw new Error('useImpact must be used inside ImpactProvider')
  return api
}
