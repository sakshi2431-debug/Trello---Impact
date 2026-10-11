WHAT IMPACT IS
Impact is an optional review inside the Trello card popup. When a person
is about to make a change, Impact reads the board, finds other cards the
change might affect, and proposes actions. The person inspects, edits or
excludes them, then approves. Nothing changes until they approve.

RULES (never break these)
1. Opt in. The normal Trello action (Add card, Save) always works
   without Impact. Review impact is a second button beside it.
2. Trello's own UI is unchanged. Impact only adds: the Review impact
   button, an Impact tab in the tab bar, and the Impact panel in the
   popup's right side. The only exceptions, nothing else is allowed:
   - a result flag on the board after apply
   - on comments posted by Impact: the "Asked through an Impact
     review" marker and the Link cards / Not related responses
   - a flag on the board when a card is finished (marked complete,
     due date ticked, or moved to Done) before a card it depends on
     is done, with Review impact and Undo. The completion itself is
     unchanged.
3. Findings are possibilities. Use "may", never state a connection as
   fact unless rule 4 makes it confirmed.
4. Authority. A connection is CONFIRMED only when the owner of the other
   card has linked the two cards. Impact may propose editing another
   card only if the connection is confirmed AND the user is a member of
   that card. In every other case Impact may only propose a comment
   asking the owner.
5. One way to exclude: untick the action's checkbox. The summary line
   and the Apply button count update immediately. No separate Skipped
   list.
6. The user's own change is always included and has no checkbox.
7. Every proposed action has Why? (shows the quoted source text,
   labelled as the source, separate from Impact's interpretation) and
   Edit.
8. Leaving a review never loses the draft. Closing asks: Return to
   review, Keep draft and close.
   - "Keep draft and close" closes the popup and keeps the text.
     New card: choosing "Add a card" in that list restores it.
     Edit: the card shows Trello's "Unsaved changes" marker and the
     editor reopens with the text.
   - The review stays with the draft for the session, including
     edited comments and unticked actions. The Impact tab reopens it.
   - Discard = the existing Cancel button in the draft or editor.
     There is no separate discard control.
9. Say once per review that suggestions are AI generated and can be
   wrong.

PANEL STRUCTURE (same order in every review)
Order is Header > Change > Actions > Summary. The user's own change is
the first row. Each action carries its own finding behind Why?. Only
when ONE finding drives several actions (Scenario 2) show a Finding
section between Change and Actions.
Header (Review impact, count, View scope). Summary is the summary line,
then Back and Apply N actions.

BOARD
The demo board is named "Marketing launch".

FLOW
1. Entry: Review impact beside Add card (new card) or Save (edit).
2. Checking: spinner, "Your draft is unchanged", Stop checking.
3. Review: panel as above. View scope lists what was and was not read.
4. Applying: actions run in order, each row shows its status. A later
   action waits for the one it depends on.
5. Results: each action is exactly one of Applied, Not applied,
   Not run (dependency failed), or Outcome unknown.
   - Retry is offered only for Not applied or Not run.
   - Outcome unknown offers Check status and a link to the card.
     Never retry it blindly, so nothing posts twice.
6. Later: the Impact tab reopens the last review and shows each
   question as Awaiting reply, Confirmed (owner linked the cards), or
   Declined.

OWNER SIDE
A comment posted by Impact appears on the owner's card marked "Asked
through an Impact review" with two responses: Link cards, Not related.
Link cards attaches the card and marks the connection confirmed.

SCENARIO 1: new work arrives
User drafts "Accessibility review". Impact finds two possible
connections and proposes: create the card (always included), comment to
Morgan on Website Launch, comment to Ana on Release checklist. No
connection is confirmed yet, so both are questions.

SCENARIO 2: an existing requirement changes
User edits Website Launch's description to add "Accessibility review
must now include the mobile signup flow."
- If Morgan linked the cards and the user is a member of Accessibility
  review: propose saving the description (always included) and updating
  Accessibility review's description, showing Before and After.
- If not linked: propose saving the description and a comment asking
  Morgan. No edit to the other card.

IMPLEMENTATION
All findings are scripted from demo data. Nothing calls an AI or the
Trello API. Simulate apply with a short delay per action. Provide a
hidden debug switch to force: success, creation failed, outcome
unknown.

DATE CHANGE
Changing a card's due date is a second entry point, beside Save in the
Dates popover. Impact reads dependency sentences in card descriptions,
checklists and comments (e.g. "5 working days after Legal Approval")
and proposes a comment asking each affected owner. The same rules,
panel structure and flow apply; the user's own change row is "Save
<card> date". A later date is followed through the board: cards that wait for a
moved card may slip, and so may the cards that wait for those, across
lists. Each card reached this way gets one question, and Why? shows
the chain step by step. Other cards' dates are never changed by Impact.

FINISHING EARLY
Finishing a card before a card it depends on (a card it waits for, or
a card that must be done before it) shows the flag above. Review
impact opens the card's Impact tab: the change, the unfinished cards,
a question to each owner, and Reopen (unticked) for the person's own
card.

BUILD ORDER
Scenario 1 end to end, then stop for my review. Do not start
Scenario 2 until I approve.
