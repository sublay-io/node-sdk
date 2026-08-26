import { SublayHttpClient } from "../../core/client";
import {
  ReputationGrant,
  ReputationGrantTargetType,
} from "../../interfaces/ReputationGrant";

export interface MintGrantProps {
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
  note?: string | null;
  metadata?: Record<string, any> | null;
  /** `targetType` and `targetId` must be supplied together, or not at all. */
  targetType?: ReputationGrantTargetType;
  targetId?: string;
}

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
