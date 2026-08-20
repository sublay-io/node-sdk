export interface PushDeviceResult {
  platform: string;
  success: boolean;
  reason?: string;
}

export interface SendPushResult {
  results: Record<string, PushDeviceResult[]>;
}

/**
 * Every push event type — the full app-notification type set plus the chat
 * `message` event (push-only). Mirrors the server's `PUSH_EVENT_TYPES` exactly
 * (server `src/constants/push/pushEvents.ts`); these are the only names a
 * `disabledTypes` set may contain.
 */
export const PUSH_EVENT_TYPES = [
  "entity-comment",
  "comment-reply",
  "entity-mention",
  "comment-mention",
  "entity-reaction",
  "comment-reaction",
  "entity-reaction-milestone-specific",
  "entity-reaction-milestone-total",
  "comment-reaction-milestone-specific",
  "comment-reaction-milestone-total",
  "new-follow",
  "connection-request",
  "connection-accepted",
  "space-membership-approved",
  "event-invite",
  "event-updated",
  "event-cancelled",
  "message",
] as const;

export type PushEventType = (typeof PUSH_EVENT_TYPES)[number];

/**
 * The four client-facing conversation-mute duration choices. Send the CHOICE,
 * never a raw timestamp — the server resolves it and represents "forever" via
 * the explicit `mutedForever` signal on the returned member. Mirrors the
 * server's `MUTE_DURATIONS` (server `src/helpers/push/muteDuration.ts`).
 */
export const MUTE_DURATIONS = ["8h", "24h", "1w", "forever"] as const;

export type MuteDuration = (typeof MUTE_DURATIONS)[number];

/** Response of read/update notification preferences. */
export interface NotificationPreferences {
  disabledTypes: PushEventType[];
}

/** A Web Push subscription, exactly as `PushManager.subscribe()` returns it. */
export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Identifies one physical device. Mirrors the server's device-identifier body
 * exactly (server `src/v7/validation/push-notifications/push-notifications.schema.ts`):
 * a provider token for `ios`/`android`, a Web Push subscription for `web`. The
 * union encodes the server's own cross-check — it rejects the same
 * combinations the server's `superRefine` rejects.
 *
 * Passed to `auth.signOut` to unbind that device's push binding in the same
 * transaction as the sign-out.
 */
export type PushDeviceIdentifier =
  | { platform: "ios" | "android"; token: string }
  | { platform: "web"; subscription: WebPushSubscription };
