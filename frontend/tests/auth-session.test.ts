import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  fetch: vi.fn(),
  state: {} as Record<string, unknown>,
}));
vi.mock("@/lib/fetch", () => ({ fetchWithTimeout: fixture.fetch }));
vi.mock("@/features/auth/store", () => ({
  useAuthStore: { getState: () => fixture.state },
}));

beforeEach(() => {
  vi.resetModules();
  fixture.fetch.mockReset();
  fixture.state = {
    accessToken: "",
    refreshToken: "",
    isAuthenticated: true,
    sessionVersion: 1,
    user: { id: "user-a" },
    isTokenExpiringSoon: () => true,
    clearAuth: vi.fn(),
    setAuth: vi.fn(),
  };
});

const refreshed = {
  access_token: "",
  refresh_token: "",
  expires_at: 9999999999,
  user: { id: "user-a" },
};

describe("cookie session refresh", () => {
  it("refreshes using cookies and shares one request between concurrent consumers", async () => {
    fixture.fetch.mockResolvedValue({ ok: true, json: async () => refreshed });
    const { getValidToken } = await import("@/features/auth/api/authApi");
    expect(
      await Promise.all([getValidToken(), getValidToken(), getValidToken()]),
    ).toEqual(["", "", ""]);
    expect(fixture.fetch).toHaveBeenCalledTimes(1);
    expect(fixture.fetch.mock.calls[0][1]).toMatchObject({
      credentials: "include",
    });
    const body = JSON.parse(fixture.fetch.mock.calls[0][1].body);
    expect(body.refresh_token).toBeUndefined();
    expect(body.timezone).toBeTruthy();
    expect(fixture.state.setAuth).toHaveBeenCalledTimes(1);
  });

  it("does not rotate a healthy cookie session on every API call", async () => {
    fixture.state.isTokenExpiringSoon = () => false;
    const { getValidToken } = await import("@/features/auth/api/authApi");
    expect(await getValidToken()).toBe("");
    expect(fixture.fetch).not.toHaveBeenCalled();
  });

  it("verifies a restored cookie session when dashboard bootstrap forces refresh", async () => {
    fixture.state.isTokenExpiringSoon = () => false;
    fixture.fetch.mockResolvedValue({ ok: true, json: async () => refreshed });
    const { getValidToken } = await import("@/features/auth/api/authApi");
    await getValidToken(true);
    expect(fixture.fetch).toHaveBeenCalledTimes(1);
    expect(fixture.state.setAuth).toHaveBeenCalledTimes(1);
  });

  it("rejects a refresh response after logout changes the session", async () => {
    let finish!: (value: unknown) => void;
    fixture.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { getValidToken } = await import("@/features/auth/api/authApi");
    const pending = getValidToken();
    fixture.state.sessionVersion = 2;
    finish({ ok: true, json: async () => refreshed });
    await expect(pending).rejects.toThrow("session changed");
    expect(fixture.state.setAuth).not.toHaveBeenCalled();
  });

  it("keeps metadata on network failure and clears it when the session is rejected", async () => {
    fixture.fetch.mockRejectedValueOnce(new Error("offline"));
    const { getValidToken } = await import("@/features/auth/api/authApi");
    await expect(getValidToken()).rejects.toThrow("offline");
    expect(fixture.state.clearAuth).not.toHaveBeenCalled();
    fixture.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "expired" }),
    });
    await expect(getValidToken()).rejects.toThrow("expired");
    expect(fixture.state.clearAuth).toHaveBeenCalledTimes(1);
  });
});
