import {
  getLocationValueForDB,
  type LocationObject,
  OrganizerDefaultConferencingAppType,
} from "@calcom/app-store/locations";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

/**
 * Reads the booker location answer. The field is `{ value, optionValue }`, matching getBookingData.
 */
export function readResponseLocation(
  responses: unknown
): { value?: string; optionValue?: string } | undefined {
  if (!isRecord(responses) || !("location" in responses)) {
    return undefined;
  }

  const location = responses.location;
  if (!isRecord(location)) {
    return undefined;
  }

  const value = typeof location.value === "string" ? location.value : undefined;
  const optionValue = typeof location.optionValue === "string" ? location.optionValue : undefined;
  if (value === undefined && optionValue === undefined) {
    return undefined;
  }

  return { value, optionValue };
}

/**
 * Location string the booking will use, computed before the request is sent.
 * handleCreateBooking sees this payload directly, and the API only fills location later.
 * Mirrors getBookingData extraction, the empty-location fallback in RegularBookingService,
 * and getLocationValueForDB for static links. A locationUrl from the booker wins, same as
 * platformBookingLocation on the server.
 */
export function resolveBookingLocation({
  responses,
  eventLocations,
  locationUrl,
}: {
  responses: unknown;
  eventLocations?: LocationObject[] | null;
  locationUrl?: string | null;
}): string {
  const customLocation = locationUrl?.trim();
  if (customLocation) {
    return customLocation;
  }

  const responseLocation = readResponseLocation(responses);
  let locationValue = "";
  if (responseLocation) {
    const locationType = responseLocation.value ?? "";
    if (locationType === OrganizerDefaultConferencingAppType) {
      locationValue = locationType;
    } else {
      locationValue = responseLocation.optionValue || locationType || "";
    }
  }

  const locations = eventLocations ?? [];
  if (locationValue.trim().length === 0) {
    locationValue = locations[0]?.type ?? OrganizerDefaultConferencingAppType;
  }

  if (locations.length === 0) {
    return locationValue;
  }

  return getLocationValueForDB(locationValue, locations).bookingLocation;
}
