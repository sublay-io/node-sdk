import { SublayHttpClient } from "../../core/client";
import {
  GrantSummary,
  ReputationGrant,
  ReputationGrantTargetType,
} from "../../interfaces/ReputationGrant";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface ListGrantsProps extends SpaceReputationContextParams {
  page?: number;
  limit?: number; // capped at 100 server-side

  // ── Filters — exactly ONE shape per request ─────────────────────────────
  /** What this user received. */
  recipientId?: string;
  /** What this user sent. */
  senderId?: string;
  /** Who rewarded this item — supplied together with `targetId`. */
  targetType?: ReputationGrantTargetType;
  targetId?: string;

  /** Associations to expand. Only `"user"` is supported (hydrates both parties). */
  include?: string;
}

/**
 * The `summary` block rides alongside the page envelope, and only on the
 * target filter shape.
 */
export interface ListGrantsResponse extends PaginatedResponse<ReputationGrant> {
  summary?: GrantSummary;
}

/**
 * Lists reputation grants.
 *
 * Exactly one filter shape per request — `recipientId`, `senderId`, or
 * `targetType` + `targetId`. Supplying none or combining two is a `400`; the
 * shapes are not AND-ed, which is what keeps the `summary` block reconcilable
 * with the rows beneath it.
 *
 * Only positive grants are ever returned — for a service key exactly as for a
 * user token. Negative grants are app moderation deductions and are readable
 * only from the dashboard.
 */
export async function listGrants(
  client: SublayHttpClient,
  data: ListGrantsProps
): Promise<ListGrantsResponse> {
  const {
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const response = await client.projectInstance.get<ListGrantsResponse>(
    "/reputation-grants",
    {
      params: {
        ...rest,
        // `spaceReputationId=context` scores each hydrated user against THAT
        // GRANT'S own bucket. Normalized rather than spread raw — axios would
        // bracket-encode the object and the server would ignore it.
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      },
    }
  );
  return response.data;
}
