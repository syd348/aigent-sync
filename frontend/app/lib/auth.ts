const AUTH_STORAGE_KEY = "aigent_sync_session";

export type AuthUser = {
  id: number;
  slackUserId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  slackTeamId: string;
  teamName?: string | null;
};

export type StoredAuthSession = {
  token: string;
  user: AuthUser;
};

export function getSessionToken(): string | null {
  const session = getStoredSession();
  return session?.token ?? null;
}

export function getStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed.token || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthUser(): AuthUser | null {
  return getStoredSession()?.user ?? null;
}

export function isLoggedIn(): boolean {
  return Boolean(getSessionToken());
}

export function setStoredSession(session: StoredAuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function setSessionToken(token: string): void {
  const existing = getStoredSession();
  if (existing) {
    setStoredSession({ ...existing, token });
  } else {
    setStoredSession({
      token,
      user: {
        id: 0,
        slackUserId: "",
        displayName: "Loading…",
        slackTeamId: "",
      },
    });
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function mapUserFromApi(data: {
  id: number;
  slack_user_id: string;
  display_name: string;
  email?: string | null;
  avatar_url?: string | null;
  slack_team_id: string;
  team_name?: string | null;
}): AuthUser {
  return {
    id: data.id,
    slackUserId: data.slack_user_id,
    displayName: data.display_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    slackTeamId: data.slack_team_id,
    teamName: data.team_name,
  };
}
