import { MeetLocationType } from "@calcom/app-store/constants";
import { OrganizerDefaultConferencingAppType } from "@calcom/app-store/locations";
import { describe, expect, it } from "vitest";
import { resolveBookingLocation } from "./resolveBookingLocation";

describe("resolveBookingLocation", () => {
  it("returns the integration type selected in the form", () => {
    expect(
      resolveBookingLocation({
        responses: {
          location: { value: MeetLocationType, optionValue: "" },
        },
        eventLocations: [{ type: MeetLocationType }],
      })
    ).toBe("integrations:google:meet");
  });

  it("returns the organizer custom link instead of the link type", () => {
    expect(
      resolveBookingLocation({
        responses: {
          location: { value: "link", optionValue: "" },
        },
        eventLocations: [{ type: "link", link: "https://meet.example.com/room" }],
      })
    ).toBe("https://meet.example.com/room");
  });

  it("keeps the organizer default provider and ignores optionValue", () => {
    expect(
      resolveBookingLocation({
        responses: {
          location: {
            value: OrganizerDefaultConferencingAppType,
            optionValue: "https://meet.google.com/abc-defg-hij",
          },
        },
        eventLocations: [{ type: OrganizerDefaultConferencingAppType }],
      })
    ).toBe("conferencing");
  });

  it("uses the attendee-entered value for phone locations", () => {
    expect(
      resolveBookingLocation({
        responses: {
          location: { value: "phone", optionValue: "+15551234567" },
        },
        eventLocations: [{ type: "phone" }],
      })
    ).toBe("+15551234567");
  });

  it("falls back to the only event location when the form has no location answer", () => {
    expect(
      resolveBookingLocation({
        responses: { name: "Ada" },
        eventLocations: [{ type: MeetLocationType }],
      })
    ).toBe("integrations:google:meet");
  });

  it("falls back to the default provider when the event has no locations", () => {
    expect(
      resolveBookingLocation({
        responses: {},
        eventLocations: [],
      })
    ).toBe("conferencing");
  });

  it("prefers an explicit custom location url", () => {
    expect(
      resolveBookingLocation({
        responses: {
          location: { value: MeetLocationType, optionValue: "" },
        },
        eventLocations: [{ type: MeetLocationType }],
        locationUrl: "https://meet.google.com/custom-link",
      })
    ).toBe("https://meet.google.com/custom-link");
  });
});
