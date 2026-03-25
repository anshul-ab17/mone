import { describe, it, expect } from "bun:test";
import { AppError } from "../../lib/appError";

describe("AppError", () => {
  it("is an instance of Error", () => {
    expect(new AppError("TEST", 400)).toBeInstanceOf(Error);
  });

  it("sets message to the error code", () => {
    expect(new AppError("NOT_FOUND", 404).message).toBe("NOT_FOUND");
  });

  it("sets code property", () => {
    expect(new AppError("UNAUTHORIZED", 401).code).toBe("UNAUTHORIZED");
  });

  it("sets status property", () => {
    expect(new AppError("INTERNAL", 500).status).toBe(500);
  });

  it.each([
    ["BAD_REQUEST",    400 as const],
    ["UNAUTHORIZED",   401 as const],
    ["FORBIDDEN",      403 as const],
    ["NOT_FOUND",      404 as const],
    ["INTERNAL_ERROR", 500 as const],
  ])("code=%s status=%d are stored correctly", (code, status) => {
    const err = new AppError(code, status);
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
  });
});
