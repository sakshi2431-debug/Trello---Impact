# Trello Impact — Information Architecture

## Organizing principle

Impact lives within the board and card workflow. Information appears progressively: proposed actions first, supporting evidence and calculation details when requested, and execution outcomes after approval.

## Surface hierarchy

| Surface | Information and controls |
|---|---|
| **Board** | Existing lists and cards; return destination after review |
| **New-card draft** | Title, description, destination list, draft status; Add card and Review impact |
| **Existing card → Date editor** | Saved date, proposed date; ordinary save path and Review impact |
| **Impact → Review** | Initiating change, checked scope, required action, optional actions, skipped suggestions, exact approval summary |
| **Review → Why?** | Source quote, tentative interpretation, Open source |
| **Review → Edit** | Editable action payload and account-resolved mention; Save changes and Cancel |
| **Review → View scope** | Checked board and sources; exclusions and coverage limits |
| **Review → Skipped** | Skipped suggestion, supporting context and Restore/Undo |
| **Date review → Timing details** | Visible conditional estimate; Edit assumptions and View calculation |
| **Impact → Results** | Outcome for each approved action; recovery controls where needed |
| **Impact tab** | Reopen the current in-session review or results |

These disclosures belong to the same review surface; they do not introduce additional approval stages.

## Core information objects

| Object | Required information |
|---|---|
| **Initiating change** | Source card or draft, existing value, proposed value, saved/unsaved state |
| **Possible connection** | Related card, tentative interpretation, evidence and unresolved status |
| **Proposed action** | Action name, target, exact payload, mention, required/optional status and selection |
| **Review scope** | Checked sources, exclusions and source versions |
| **Timing estimate** | Inputs, working calendar, counting rule, exclusions and conditional result |
| **Execution outcome** | Matching action name and target, outcome status and available recovery |

A possible connection and a proposed action are separate objects: noticing related work does not authorize changing it.

## Main navigation flow

**Draft → Review impact → Inspect or edit → Apply selected actions → Results → Board**

Supporting routes:

- **Why? → Open source → Back to review**
- **Edit → Save changes or Cancel → Review**
- **Skipped → Inspect → Restore for consideration**
- **Results → Check status → Retry only if verified unapplied**

Returning to the draft preserves staged work. Editing a proposal saves only the proposal.

## State model

| State | User-facing meaning |
|---|---|
| **Draft** | Initiating change has not been saved |
| **Analyzing** | The displayed scope is being checked |
| **Ready for review** | Proposed actions are available |
| **Editing** | A proposal has unsaved edits; Apply is disabled |
| **Applying** | Approved actions are being executed |
| **Applied** | The specific action completed |
| **Not applied / Not run** | The action did not complete or was held |
| **Outcome unknown** | Completion must be verified before retry |
| **Needs fresh review** | Source content, permissions or payload changed |

Relationship status remains separate from execution status. A posted comment can be **Applied** while its connection still **Needs confirmation**.

## Content and interaction rules

- Show action names, destinations and exact payloads before approval.
- Keep the action count synchronized with selection.
- Use **Post comment on [card]** to make the delivery location explicit.
- Separate source evidence from AI interpretation.
- Keep conditional estimates and uncertainty visible.
- Restore skipped suggestions without selecting an action.
- Create the new card before posting comments that depend on it.
- Hold dependent actions if creation fails or its outcome is unknown.
- Preserve drafts and completed outcomes during recovery.
- Verify unknown outcomes before enabling retry; never replay completed actions.
- Express states through text as well as visual treatment.

Durable history and permanent dependency management are deferred, so neither appears as a destination in this architecture.
