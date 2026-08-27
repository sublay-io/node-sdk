import { SublayHttpClient } from "../../core/client";
import {
  ReputationGrant,
  ReputationGrantTargetFilter,
} from "../../interfaces/ReputationGrant";

interface MintGrantBaseProps {
  /** The user receiving (or, with a negative amount, losing) the reputation. */
  recipientId: string;
  /**
   * Any NON-ZERO integer. A mint may also DESTROY reputation, and is the only
   * path that may drive a bucket below zero. Negative mints are silent: no
   * notification, no socket broadcast, and invisible on every public read
   * surface.
   */
  amount: number;
  /** The bucket credited/debited. Omitted/null = the project-general bucket. */
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
export type MintGrantProps = MintGrantBaseProps & ReputationGrantTargetFilter;

/**
 * Mints reputation — creates it from nothing, with no sender.
 *
 * Service/master keys only, which is why there is no counterpart in
 * `@sublay/js`: a user token can never reach this route. There is deliberately
 * no actor field — the grant is written with a null `senderId` and
 * `sourceType: "app"`.
 */
export async function mintGrant(
  client: SublayHttpClient,
  data: MintGrantProps
): Promise<ReputationGrant> {
  const response = await client.projectInstance.post<ReputationGrant>(
    "/reputation-grants/mint",
    data
  );
  return response.data;
}
