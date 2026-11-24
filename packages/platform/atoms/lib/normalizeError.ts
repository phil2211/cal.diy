import type { AxiosRequestConfig } from "axios";
import { isAxiosError } from "axios";

/**
 * A canceled or aborted booking request can reject with a nullish reason.
 * Reading `.config` on that value throws
 * "Cannot read properties of undefined (reading 'config')", which the booker
 * renders as the reschedule failure.
 */
export function readAxiosErrorConfig(error: unknown): AxiosRequestConfig | undefined {
  if (!error || typeof error !== "object" || !("config" in error)) {
    return undefined;
  }

  const { config } = error;
  if (!config || typeof config !== "object") {
    return undefined;
  }

  return config as AxiosRequestConfig;
}

function readNestedErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return undefined;
  }

  const nested = value.error;
  if (!nested || typeof nested !== "object" || !("message" in nested)) {
    return undefined;
  }

  return typeof nested.message === "string" && nested.message.length > 0 ? nested.message : undefined;
}

function readErrorMessage(error: unknown): string | undefined {
  const nestedMessage = readNestedErrorMessage(error);
  if (nestedMessage) {
    return nestedMessage;
  }

  if (isAxiosError(error)) {
    const responseMessage = readNestedErrorMessage(error.response?.data);
    if (responseMessage) {
      return responseMessage;
    }
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message.length > 0 ? error.message : undefined;
  }

  return undefined;
}

export function normalizeBookingError(error: unknown): Error {
  const message = readErrorMessage(error) ?? "An error occurred";

  if (error instanceof Error && error.message === message) {
    return error;
  }

  const normalized = new Error(message);
  if (error instanceof Error && error.stack) {
    normalized.stack = error.stack;
  }

  return normalized;
}
