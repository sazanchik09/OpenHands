# DO MVP

## Product contract

DO is an outcome-oriented AI operator. The user gives DO a desired result; DO plans and executes the work through OpenHands-compatible agents and tools.

The first MVP is DO Inbox: "Take care of my inbox."

The first release should support Gmail and Calendar, but the core domain must not depend on either provider.

## Core lifecycle

1. Goal — capture the user's desired outcome.
2. Plan — turn the outcome into explicit steps.
3. Permissions — evaluate each step against the user's autonomy level.
4. Run — dispatch approved work to the execution layer.
5. Approval — pause before risky actions when required.
6. Result — report what was actually completed, what is pending, and what needs the user.
7. Memory — persist durable user preferences and successful patterns later.

## Autonomy

- ask: never execute without explicit approval.
- suggest: propose actions.
- prepare: prepare actions but don't perform external side effects.
- execute: perform actions covered by permissions.
- autopilot: perform actions within an explicitly configured policy.

## Architecture boundary

DO owns goals, planning, permissions, approvals, memory, run/result models, product UX, and activity reporting.

OpenHands owns the agent execution infrastructure.

Provider integrations such as Gmail, Calendar, Drive, browser, and CRM should sit behind tool adapters so the DO core remains provider-agnostic.

## First vertical slice

user instruction -> Goal -> Plan -> permission check -> OpenHands run -> Result

For Inbox MVP, the first safe actions are read, analyze, classify, and draft. Sending email or changing calendar state requires explicit approval unless the user has configured a stronger autonomy policy.
