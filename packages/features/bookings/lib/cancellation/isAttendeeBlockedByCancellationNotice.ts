import { isWithinMinimumRescheduleNotice } from "../reschedule/isWithinMinimumRescheduleNotice";

export const CANCELLATION_NOTICE_ERROR =
  "Cancelling is not allowed within the minimum notice period before the event";

/**
 * Attendees cannot cancel inside the event type's minimum cancellation notice.
 * The booking organizer is exempt, matching the reschedule notice.
 */
export function isAttendeeBlockedByCancellationNotice(input: {
  isOrganizer: boolean;
  bookingStartTime: Date | null;
  minimumCancellationNotice: number | null;
}): boolean {
  if (input.isOrganizer) return false;

  return isWithinMinimumRescheduleNotice(input.bookingStartTime, input.minimumCancellationNotice);
}
