import { SublayHttpClient } from "../../core/client";
import { WorkspaceAuthority } from "../../interfaces/Workspace";

export interface FetchWorkspaceAuthorityProps {
  workspaceId: string;
  // The acting user whose resolved standing to read (the service-key
  // `?actingUserId=` variant); required here.
  actingUserId: string;
}

/**
 * Authority-as-a-service read — the resolved standing
 * (`{ reasons, capabilities, permissions, rank, relativeRank }`) for the given
 * user on the workspace. A permission check is a one-line `.includes()` on the
 * result; Sublay never consumes the developer's opaque permissions.
 *
 * `relativeRank` is degenerate on this endpoint — an offset from the subject to
 * themselves is `0`, or `null` when they hold no member row here. It is
 * returned so all three workspace reads carry both coordinates; `rank` is the
 * field to read here.
 */
export async function fetchWorkspaceAuthority(
  client: SublayHttpClient,
  data: FetchWorkspaceAuthorityProps
): Promise<WorkspaceAuthority> {
  const { workspaceId, actingUserId } = data;
  const response = await client.projectInstance.get<WorkspaceAuthority>(
    `/workspaces/${workspaceId}/authority/me`,
    { params: { actingUserId } }
  );
  return response.data;
}
