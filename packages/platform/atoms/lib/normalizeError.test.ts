import { describe, expect, it } from "vitest";
import { normalizeBookingError, readAxiosErrorConfig } from "./normalizeError";

describe("readAxiosErrorConfig", () => {
  it("does not throw when a reschedule request fails without an error object", () => {
    expect(() => readAxiosErrorConfig(undefined)).not.toThrow();
    expect(readAxiosErrorConfig(undefined)).toBeUndefined();
    expect(readAxiosErrorConfig(null)).toBeUndefined();
  });

  it("returns undefined for a plain Error that has no axios config", () => {
    expect(readAxiosErrorConfig(new Error("slot_unavailable"))).toBeUndefined();
  });

  it("returns the request config when the axios error has one", () => {
    const config = { url: "/bookings", method: "post" };

    expect(readAxiosErrorConfig({ config, isAxiosError: true })).toEqual(config);
  });
});

describe("normalizeBookingError", () => {
  it("turns a missing rejection into an Error instead of reading config", () => {
    const normalized = normalizeBookingError(undefined);

    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.message).toBe("An error occurred");
    expect(readAxiosErrorConfig(normalized)).toBeUndefined();
  });

  it("keeps a plain booking Error message", () => {
    const error = new Error("slot_unavailable");

    expect(normalizeBookingError(error)).toBe(error);
  });

  it("uses the API message from an axios error that has no config", () => {
    const error = Object.assign(new Error("Request failed with status code 400"), {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          status: "error",
          error: { message: "Could not reschedule the meeting." },
        },
      },
    });

    expect(readAxiosErrorConfig(error)).toBeUndefined();
    expect(normalizeBookingError(error).message).toBe("Could not reschedule the meeting.");
  });

  it("reads an API error body that is not an Error instance", () => {
    const normalized = normalizeBookingError({
      status: "error",
      error: { message: "booking_time_out_of_bounds_error" },
    });

    expect(normalized.message).toBe("booking_time_out_of_bounds_error");
  });
});
