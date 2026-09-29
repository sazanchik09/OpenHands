/** Provider contract for the DO Inbox vertical slice. */

export interface InboxMessage {
  id: string;
  threadId?: string;
  from: string;
  to?: string;
  subject: string;
  snippet: string;
  receivedAt?: string;
  labels?: string[];
}

export interface InboxProvider {
  listRecent(limit?: number): Promise<InboxMessage[]>;
  createDraft(input: { threadId?: string; to: string; subject: string; body: string }): Promise<{ id: string }>;
}

export interface GmailMessageListResponse {
  messages?: Array<{ id: string; threadId?: string }>;
  nextPageToken?: string;
}

export interface GmailMessageResponse {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
}

export function createGmailInboxProvider(input: {
  accessToken: string;
  fetcher?: typeof fetch;
}): InboxProvider {
  const fetcher = input.fetcher ?? fetch;
  const base = "https://gmail.googleapis.com/gmail/v1/users/me";

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetcher(base + path, {
      ...init,
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gmail API ${response.status}: ${body.slice(0, 300)}`);
    }
    return (await response.json()) as T;
  }

  const header = (message: GmailMessageResponse, name: string) =>
    message.payload?.headers?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return {
    async listRecent(limit = 20) {
      const listed = await request<GmailMessageListResponse>(`/messages?maxResults=${Math.min(limit, 100)}&q=in:anywhere`);
      return Promise.all((listed.messages ?? []).map(async ({ id }) => {
        const message = await request<GmailMessageResponse>(`/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject`);
        return {
          id: message.id,
          threadId: message.threadId,
          from: header(message, "From"),
          to: header(message, "To"),
          subject: header(message, "Subject"),
          snippet: message.snippet ?? "",
          receivedAt: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : undefined,
          labels: message.labelIds,
        } satisfies InboxMessage;
      }));
    },

    async createDraft(input) {
      const raw = [
        `To: ${input.to}`,
        `Subject: ${input.subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        input.body,
      ].join("\\r\\n");
      const encoded = Buffer.from(raw, "utf8").toString("base64url");
      const body = await request<{ id: string }>("/drafts", {
        method: "POST",
        body: JSON.stringify({ message: { threadId: input.threadId, raw: encoded } }),
      });
      return { id: body.id };
    },
  };
}
