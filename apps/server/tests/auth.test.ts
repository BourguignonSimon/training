import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import axios from "axios";
import app from "../src/index.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("POST /api/auth/strava", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and token when Strava responds successfully", async () => {
    const mockStravaResponse = {
      data: {
        access_token: "fake_access_token",
        refresh_token: "fake_refresh_token",
        expires_at: 1234567890,
        athlete: { id: 123, firstname: "Simon" }
      }
    };
    mockedAxios.post.mockResolvedValue(mockStravaResponse);

    const res = await request(app)
      .post("/api/auth/strava")
      .send({ code: "valid_auth_code" });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe("fake_access_token");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://www.strava.com/oauth/token",
      expect.objectContaining({
        code: "valid_auth_code",
        grant_type: "authorization_code"
      })
    );
  });

  it("should return 400 if code is missing", async () => {
    const res = await request(app).post("/api/auth/strava").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("required");
  });

  it("should return 500 if Strava rejects the request", async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { message: "Bad Request" } }
    });

    const res = await request(app)
      .post("/api/auth/strava")
      .send({ code: "invalid_code" });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Failed to authenticate");
  });
});

describe("POST /api/auth/strava/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and new tokens when refresh succeeds", async () => {
    const mockStravaResponse = {
      data: {
        access_token: "new_access_token",
        refresh_token: "new_refresh_token",
        expires_at: 1234567890
      }
    };
    mockedAxios.post.mockResolvedValue(mockStravaResponse);

    const res = await request(app)
      .post("/api/auth/strava/refresh")
      .send({ refresh_token: "valid_refresh_token" });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe("new_access_token");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://www.strava.com/oauth/token",
      expect.objectContaining({
        refresh_token: "valid_refresh_token",
        grant_type: "refresh_token"
      })
    );
  });

  it("should return 400 if refresh_token is missing", async () => {
    const res = await request(app).post("/api/auth/strava/refresh").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("required");
  });

  it("should return 500 if refresh fails", async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { message: "Invalid refresh token" } }
    });

    const res = await request(app)
      .post("/api/auth/strava/refresh")
      .send({ refresh_token: "invalid_token" });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Failed to refresh");
  });
});

describe("GET /health", () => {
  it("should return 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
