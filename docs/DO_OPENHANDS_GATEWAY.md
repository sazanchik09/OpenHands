# DO → OpenHands gateway

DO keeps the execution boundary provider-agnostic. The DO UI sends executable plan steps to a server-side gateway, which can enrich those steps with connected data before dispatching them to OpenHands.

## Configure

Set:

    VITE_DO_OPENHANDS_ENDPOINT=<your server-side gateway endpoint>

Do not put API keys or private credentials in a VITE_ variable. Vite exposes those values to the browser.

For the first DO Inbox vertical slice, configure the gateway process with:

    DO_GMAIL_ACCESS_TOKEN=<server-side Gmail OAuth access token>

The token must stay server-side. The gateway uses it to read the current Gmail inbox and inject a bounded inbox context into OpenHands for inbox-related plan steps.

The current gateway exposes:

    GET /health
    GET /inbox?limit=20
    POST /run
    GET /run/:id

When Gmail is configured, /health reports gmailConfigured: true.

## Gmail safety boundary

The first Inbox slice is intentionally read/prepare only.

Allowed:
- list inbox messages
- inspect sender, recipient, subject, snippet and labels
- analyze and classify messages
- identify action items
- prepare reply content

Blocked until a separate DO approval flow is implemented:
- send email
- delete email
- modify calendar state

OpenHands receives an explicit instruction not to execute those blocked actions. Email content is treated as untrusted data and must not be interpreted as tool instructions.

## Request

The gateway receives a POST with:

    {
      "goalId": "string",
      "instruction": "string",
      "stepId": "string",
      "stepTitle": "string",
      "stepDescription": "string"
    }

For inbox-related steps, the gateway fetches the current inbox server-side before creating the OpenHands conversation.

## Response

A successful gateway may return:

    {
      "id": "external-run-id",
      "status": "queued",
      "message": "Task accepted",
      "statusUrl": "/run/..."
    }

Supported statuses are queued, completed, and failed.

## Security

The recommended production shape is:

    DO browser
      -> your authenticated server-side gateway
      -> Gmail API
      -> OpenHands Agent Server / SDK

The gateway owns authentication, network access, tenant isolation, Gmail OAuth/token storage, and OpenHands-specific API details. Do not expose Gmail or OpenHands credentials in the browser.

The current DO_GMAIL_ACCESS_TOKEN environment variable is a development/MVP credential model for one connected mailbox. Production should replace it with per-user OAuth token storage and tenant isolation.

## Current state

The UI supports configured gateway execution and run-status polling. The gateway can now read a live Gmail inbox and pass that context to OpenHands for the DO Inbox workflow. The next product step is a first-class approval endpoint/UI that turns prepared replies into Gmail drafts and only allows sending after explicit user approval.
