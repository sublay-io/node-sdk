import { SublayHttpClient } from "../../core/client";

export interface ChangePasswordProps {
  userId: string;
  /** The user's current password (verified before the change). */
  password: string;
  newPassword: string;
  /**
   * OPTIONAL — the session to spare, named by the refresh token that device
   * holds.
   *
   * Changing a password destroys every token family for that user. The change
   * route is authenticated by a service key here, so there is no "caller's
   * session" to infer: pass the refresh token of the device that should stay
   * signed in — typically one your own client just sent you — and its family
   * survives while every other device must re-authenticate.
   *
   * Omit it and every session for the user ends, which is the right default for
   * a server-side caller acting on someone's behalf: it usually holds no
   * refresh token, and revoking everything is the fail-secure outcome rather
   * than an error. A token that fails verification, or belongs to a different
   * user, is ignored — it can never preserve someone else's session.
   */
  refreshToken?: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export async function changePassword(
  client: SublayHttpClient,
  data: ChangePasswordProps
): Promise<ChangePasswordResponse> {
  const response = await client.projectInstance.post<ChangePasswordResponse>(
    "/auth/change-password",
    data
  );
  return response.data;
}
