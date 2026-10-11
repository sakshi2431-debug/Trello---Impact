import { useEffect, useRef, useState } from 'react'
import { Box } from '@atlaskit/primitives/compiled/box'
import { useImpact } from '../../impact/ImpactProvider'
import type { Card } from '../../types'
import { styles } from './styles'
import { ConnectionReview, QuestionsOnCard } from './ConnectionReview'
import { DraftStage, CheckingStage, ReviewStage, SourceStage } from './ReviewStage'
import { DescriptionReviewStage } from './DescriptionReview'
import { ApplyingStage, ResultsStage, LaterStage } from './ResultsStage'

/** The Impact panel on the right of the card popup. It replaces Comments and activity while the Impact tab is selected. */
export function ImpactPanel({ card }: { card: Card }) {
  const { session } = useImpact()
  const headingRef = useRef<HTMLDivElement>(null)
  const [isReviewingAgain, setReviewingAgain] = useState(false)
  const phase = session?.cardId === card.id ? session.phase : undefined

  // Move focus to the new heading when the panel changes stage, so keyboard and screen reader users follow along.
  useEffect(() => {
    if (phase === 'review' || phase === 'results') headingRef.current?.focus()
  }, [phase])

  if (session?.source?.cardId === card.id && session.cardId !== card.id) return <SourceStage card={card} />
  if (!session || session.cardId !== card.id)
    return (
      <>
        <ConnectionReview key={card.id} card={card} />
        <QuestionsOnCard card={card} />
      </>
    )
  if (session.phase === 'done' && isReviewingAgain) return <ConnectionReview key={`${card.id}:again`} card={card} onBack={() => setReviewingAgain(false)} />
  return (
    <Box xcss={styles.panel}>
      {session.phase === 'draft' && <DraftStage kind={session.kind} />}
      {session.phase === 'checking' && <CheckingStage />}
      {session.phase === 'review' &&
        (session.kind === 'description' ? <DescriptionReviewStage card={card} headingRef={headingRef} /> : <ReviewStage card={card} headingRef={headingRef} />)}
      {session.phase === 'applying' && <ApplyingStage card={card} />}
      {session.phase === 'results' && <ResultsStage card={card} headingRef={headingRef} />}
      {session.phase === 'done' && <LaterStage card={card} onReviewAgain={() => setReviewingAgain(true)} />}
    </Box>
  )
}
