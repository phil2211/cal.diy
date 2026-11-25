import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAttendeeBlockedByCancellationNotice } from "./isAttendeeBlockedByCancellationNotice";

const NOW = new Date("2026-06-01T12:00:00.000Z");

describe("isAttendeeBlockedByCancellationNotice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks an attendee inside the notice window", () => {
    expect(
      isAttendeeBlockedByCancellationNotice({
        isOrganizer: false,
        bookingStartTime: new Date("2026-06-01T12:30:00.000Z"),
        minimumCancellationNotice: 60,
      })
    ).toBe(true);
  });

  it("allows an attendee when the event is further away than the notice", () => {
    expect(
      isAttendeeBlockedByCancellationNotice({
        isOrganizer: false,
        bookingStartTime: new Date("2026-06-01T14:00:00.000Z"),
        minimumCancellationNotice: 60,
      })
    ).toBe(false);
  });

  it("allows cancellation at the exact notice boundary", () => {
    expect(
      isAttendeeBlockedByCancellationNotice({
        isOrganizer: false,
        bookingStartTime: new Date("2026-06-01T13:00:00.000Z"),
        minimumCancellationNotice: 60,
      })
    ).toBe(false);
  });

  it("allows cancellation after the event has started", () => {
    expect(
      isAttendeeBlockedByCancellationNotice({
        isOrganizer: false,
        bookingStartTime: new Date("2026-06-01T11:30:00.000Z"),
        minimumCancellationNotice: 60,
      })
    ).toBe(false);
  });

  it("allows cancellation when no notice is configured", () => {
    expect(
      isAttendeeBlockedByCancellationNotice({
        isOrganizer: false,
        bookingStartTime: new Date("2026-06-01T12:30:00.000Z"),
        minimumCancellationNotice: null,
      })
    ).toBe(false);
  });

  it("lets the organizer cancel inside the notice window", () => {
    expect(
      isAttendeeBlockedByCancellationNotice({
        isOrganizer: true,
        bookingStartTime: new Date("2026-06-01T12:30:00.000Z"),
        minimumCancellationNotice: 60,
      })
    ).toBe(false);
  });
});
