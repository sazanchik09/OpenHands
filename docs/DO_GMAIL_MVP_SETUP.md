# DO Inbox MVP — Gmail setup

The current MVP uses a server-side Gmail OAuth access token.

## Environment

Run the DO gateway with:

    VITE_DO_OPENHANDS_ENDPOINT=http://127.0.0.1:18110
    DO_GMAIL_ACCESS_TOKEN=<temporary Gmail OAuth access token>

Keep DO_GMAIL_ACCESS_TOKEN out of browser-exposed VITE_ variables.

## Gmail permission

For the Inbox MVP, the token needs permission to read Gmail messages, such as the Gmail readonly scope.

The gateway only reads the inbox and passes a bounded set of message metadata/snippets to OpenHands.

## Run

Start OpenHands Agent Server as usual, then:

    npm run dev:do-gateway

The gateway listens on:

    http://127.0.0.1:18110

Check:

    GET /health

Then:

    GET /inbox?limit=20

The latter should return the current inbox messages when Gmail is configured.

## First real DO flow

In the DO UI use:

    Take care of my inbox

Then run the generated plan.

The current safety boundary is:

    Gmail read
      -> DO plan
      -> OpenHands analysis
      -> result
      -> approval-required actions remain blocked

DO does not send email or modify calendar state in this MVP.

## Production follow-up

Replace the single environment token with per-user OAuth authorization and encrypted token storage. Then add explicit approval records and a send/draft action endpoint so DO can prepare a reply and only send it after the user approves.
