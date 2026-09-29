# DO → OpenHands gateway

DO keeps the execution boundary provider-agnostic. The DO UI can send executable plan steps to an OpenHands-compatible HTTP gateway.

## Configure

Set:

    VITE_DO_OPENHANDS_ENDPOINT=<your server-side gateway endpoint>

Do not put API keys or private credentials in a VITE_ variable. Vite exposes those values to the browser.

When the variable is absent, /do uses the local execution preview.

## Request

The gateway receives a POST with:

    {
      "goalId": "string",
      "instruction": "string",
      "stepId": "string",
      "stepTitle": "string",
      "stepDescription": "string"
    }

## Response

A successful gateway may return:

    {
      "id": "external-run-id",
      "status": "queued",
      "message": "Task accepted",
      "statusUrl": "https://gateway.example/runs/..."
    }

Supported statuses are queued, completed, and failed.

The gateway is intentionally an adapter contract. DO does not assume a specific OpenHands deployment URL or authentication mechanism.

## Security

The recommended production shape is:

    DO browser
      -> your server-side gateway
      -> OpenHands Agent Server / SDK

The gateway owns authentication, network access, tenant isolation, and any OpenHands-specific API details. Do not expose OpenHands credentials in the browser.

## Current state

The UI now supports the configured gateway path and preserves the local preview fallback. A future step is to add run-status polling/WebSocket updates so a queued external run can transition to completed with live progress.
