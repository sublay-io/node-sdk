import { SublayHttpClient } from "../../core/client";
import {
  ReputationGrant,
  ReputationGrantTargetFilter,
} from "../../interfaces/ReputationGrant";

interface CreateGrantBaseProps {
  /**
   * The sender — the user the reputation is debited FROM. Required: a service
   * key has no session user, so the actor must be named explicitly.
   *
   * Spelled `actingUserId` rather than `userId` because this body also names a
   * target user (`recipientId`), and the house rule reserves `userId` for the
   * target on any route that has one.
   */
  actingUserId: string;
  /** The user receiving the reputation. Must differ from `actingUserId`. */
  recipientId: string;
  /**
   * Positive integer. A transfer can never mint (negatives) nor be a no-op
   * (zero) — use {@link mintGrant} to create or destroy reputation.
   */
  amount: number;
  /** The bucket both legs move in. Omitted/null = the project-general bucket. */
  spaceId?: string | null;
  /**
   * Free-text reason. Trimmed and capped at 2000 characters server-side.
   * Genuinely nullable — an explicit `null` is accepted and means "no note".
   */
  note?: string | null;
  /**
   * Arbitrary JSON, capped at 1 MB server-side.
   *
   * NOT nullable — deliberately asymmetric with `note` directly above, not a
   * typo. The server's shared `metadataSchema` is `z.record(...).optional()`
   * with no `.nullable()`, so an explicit `metadata: null` is rejected with
   * `400 reputation-grant/invalid-body`. Omit the key to mean "no metadata".
   */
  metadata?: Record<string, any>;
}

/**
 * `targetType` and `targetId` are supplied together or not at all — the
 * both-or-neither pair is carried by {@link ReputationGrantTargetFilter}, which
 * makes the half-filled shape a compile error instead of a
 * `400 reputation-grant/invalid-body`.
 */
export type CreateGrantProps = CreateGrantBaseProps &
  ReputationGrantTargetFilter;

/**
 * Transfers reputation from one user to another — a **debited transfer**: the
 * amount leaves the sender's bucket and lands in the recipient's bucket in the
 * same space. Nothing is created.
 *
 * A service key is the "mediated" caller here: the project setting that can
 * disable user-initiated grants, and block edges between the two parties, are
 * both skipped.
 */
export async function createGrant(
  client: SublayHttpClient,
  data: CreateGrantProps
): Promise<ReputationGrant> {
  const response = await client.projectInstance.post<ReputationGrant>(
    "/reputation-grants",
    data
  );
  return response.data;
}
