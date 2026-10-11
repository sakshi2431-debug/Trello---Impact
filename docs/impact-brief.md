# Trello Impact — Final Project Brief

## Project overview

Trello Impact is an AI-assisted coordination feature that helps project leads understand how a new task or proposed date change may relate to existing work.

It brings relevant context into the moment of change, explains possible connections, and lets users review exact actions before approving them.

**Core promise:** Understand what may need attention before committing a change to the board.

## Problem statement

Related work can be expressed informally across card descriptions, checklists and comments. When someone adds a task or changes a date, the project lead may need to inspect other cards, identify relevant connections and ask contributors what should happen next.

The project explores whether contextual suggestions can reduce this coordination effort while preserving Trello’s lightweight workflow.

The frequency and severity of this problem remain research questions.

## Target users

**Primary user:** A project lead coordinating a time-bound project across multiple contributors.

**Secondary users:** Card owners and collaborators who clarify relationships or respond to questions posted on their cards.

## Job to be done

“When I add work or change the plan, help me identify what else may need attention so I can coordinate the next steps before committing the change.”

## Design objective

Create a contextual review experience that lets the project lead:

- Inspect possible connections and their supporting evidence.
- Edit proposed responses and choose optional actions.
- Understand exactly what approval will change.
- Distinguish completed actions from unresolved relationships.
- Recover from failures without duplicating completed work.

## Primary scenario

On a fictional **Website Launch** board, the lead drafts **Accessibility review**.

Impact identifies two possible connections:

- **Website Launch:** An existing accessibility requirement may relate to the new task.
- **Release checklist:** The checklist may need to account for the review.

The user reviews three proposed actions:

1. Create **Accessibility review** in **To do**.
2. Optionally post a comment on **Website Launch**, mentioning Morgan.
3. Optionally post a comment on **Release checklist**, mentioning Ana.

Card creation is required within this review. Comments are optional, and selecting or deselecting them updates the approval count.

An unrelated **Accessibility article** remains under Skipped and can be restored for review.

Posting a question leaves the connection unconfirmed.

## Secondary scenario

The lead proposes changing **Legal Approval** from November 4 to November 6, 2026.

Impact shows a conditional timing estimate for **Partner announcement** and prepares an optional clarification comment. The user can inspect and edit the calculation assumptions.

Approval saves the source date and posts the selected question. The estimate does not become an agreed deadline or automatically change the announcement date.

## AI and user responsibilities

| Responsibility | Owner |
|---|---|
| Interpret accessible context and suggest possible connections | AI |
| Draft questions and explain supporting evidence | AI |
| Calculate timing from explicit inputs | Deterministic system |
| Validate permissions, source freshness and execution outcomes | Deterministic system |
| Select, edit and approve actions | Project lead |
| Confirm relationships and agree commitments | Relevant collaborators |

Approval applies only to the displayed actions. It does not authorize future edits.

## Scope

**Included:** Contextual entry from card creation and date editing; a review panel alongside the initiating card; inline evidence and editing; optional comments; exact approval summaries; results and recovery states.

**Outside the current scope:** Permanent dependency records, checklist writes, autonomous follow-up, cross-tool analysis, a general chatbot and durable review history.

The proposed Impact tab reopens the current in-session review or results.

## Expected value

**User hypothesis:** Bringing related context into the change workflow could reduce manual cross-checking and improve coordination decisions.

**Business hypothesis:** Useful coordination support could help growing teams continue using Trello and support paid adoption.

These are intended outcomes, not demonstrated results.

## Success measures

- Accuracy of decisions about relevant and irrelevant connections.
- Understanding of what Apply will change.
- Time to reach an informed coordination decision.
- Successful editing, dismissal and recovery.
- Review effort compared with manual checking.

Guardrails include missed connections, incorrect suggestions, unintended writes, duplicate actions and excessive review burden.

## Deliverables and validation

Deliver a focused prototype covering the main flow, evidence, editing, skipped-item restoration, results, recovery and the date extension.

Test with users of team task-management tools using valid, ambiguous and incorrect connections. Verify keyboard access, focus management, readable contrast and status announcements.

The current local prototype uses scripted suggestions and simulated execution. Real AI quality, Trello integration and user outcomes remain to be validated.
