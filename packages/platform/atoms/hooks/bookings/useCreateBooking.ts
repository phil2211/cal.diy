import type { BookingCreateBody } from "@calcom/features/bookings/lib/bookingCreateBodySchema";
import type { BookingResponse } from "@calcom/features/bookings/types";
import { SUCCESS_STATUS } from "@calcom/platform-constants";
import type { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from "@calcom/platform-types";
import { useMutation } from "@tanstack/react-query";
import http from "../../lib/http";
import { normalizeBookingError } from "../../lib/normalizeError";

export type UseCreateBookingInput = BookingCreateBody & { locationUrl?: string };

interface IUseCreateBooking {
  onSuccess?: (res: ApiSuccessResponse<BookingResponse>) => void;
  onError?: (err: ApiErrorResponse | Error) => void;
}
export const useCreateBooking = (
  { onSuccess, onError }: IUseCreateBooking = {
    onSuccess: () => {
      return;
    },
    onError: () => {
      return;
    },
  }
) => {
  const createBooking = useMutation<ApiResponse<BookingResponse>, Error, UseCreateBookingInput>({
    mutationFn: async (data) => {
      try {
        const res = await http.post<ApiResponse<BookingResponse>>("/bookings", data);
        if (res.data?.status === SUCCESS_STATUS) {
          return res.data;
        }
        throw normalizeBookingError(res.data);
      } catch (error) {
        throw normalizeBookingError(error);
      }
    },
    onSuccess: (data) => {
      if (data.status === SUCCESS_STATUS) {
        onSuccess?.(data);
      } else {
        onError?.(normalizeBookingError(data));
      }
    },
    onError: (err) => {
      onError?.(normalizeBookingError(err));
    },
  });
  return createBooking;
};
