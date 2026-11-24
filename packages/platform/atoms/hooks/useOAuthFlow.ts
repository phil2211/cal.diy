import type { ApiResponse } from "@calcom/platform-types";
import type { AxiosError } from "axios";
import { debounce } from "lodash";
import { useEffect, useState } from "react";
import usePrevious from "react-use/lib/usePrevious";
import http from "../lib/http";
import { readAxiosErrorConfig } from "../lib/normalizeError";

export interface useOAuthProps {
  accessToken?: string;
  refreshUrl?: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  onTokenRefreshStart?: () => void;
  onTokenRefreshSuccess?: () => void;
  onTokenRefreshError?: (error: string) => void;
  clientId: string;
}

const debouncedRefresh = debounce(http.refreshTokens, 10000, { leading: true, trailing: false });
export const useOAuthFlow = ({
  accessToken,
  refreshUrl,
  clientId,
  onError,
  onSuccess,
  onTokenRefreshStart,
  onTokenRefreshSuccess,
  onTokenRefreshError,
}: useOAuthProps) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [clientAccessToken, setClientAccessToken] = useState<string>("");
  const prevAccessToken = usePrevious(accessToken);
  useEffect(() => {
    const interceptorId =
      clientAccessToken && http.getAuthorizationHeader()
        ? http.responseInterceptor.use(undefined, async (err: AxiosError) => {
            const originalRequest = readAxiosErrorConfig(err);
            if (refreshUrl && err?.response?.status === 498 && !isRefreshing && originalRequest) {
              setIsRefreshing(true);
              onTokenRefreshStart?.();
              const refreshedToken = await debouncedRefresh(refreshUrl);
              if (refreshedToken) {
                setClientAccessToken(refreshedToken);
                onSuccess?.();
                onTokenRefreshSuccess?.();
                return http.instance({
                  ...originalRequest,
                  headers: { ...originalRequest.headers, Authorization: `Bearer ${refreshedToken}` },
                });
              } else {
                const errorMessage = "Invalid Refresh Token.";
                onError?.(errorMessage);
                onTokenRefreshError?.(errorMessage);
              }

              setIsRefreshing(false);
            }
            return Promise.reject(err);
          })
        : "";

    return () => {
      // Axios assigns id 0 to the first interceptor. A truthy check never ejects it,
      // so reschedule requests keep stacking handlers that re-read a missing config.
      if (typeof interceptorId === "number") {
        http.responseInterceptor.eject(interceptorId);
      }
    };
  }, [
    clientAccessToken,
    isRefreshing,
    refreshUrl,
    onError,
    onSuccess,
    onTokenRefreshStart,
    onTokenRefreshSuccess,
    onTokenRefreshError,
  ]);

  useEffect(() => {
    if (accessToken && http.getUrl() && prevAccessToken !== accessToken) {
      http.setAuthorizationHeader(accessToken);
      http
        .get<ApiResponse>(`/provider/${clientId}/access-token`)
        .catch(async (err: AxiosError) => {
          if ((err.response?.status === 498 || err.response?.status === 401) && refreshUrl) {
            setIsRefreshing(true);
            onTokenRefreshStart?.();
            const refreshedToken = await http.refreshTokens(refreshUrl);
            if (refreshedToken) {
              setClientAccessToken(refreshedToken);
              onSuccess?.();
              onTokenRefreshSuccess?.();
            } else {
              const errorMessage = "Invalid Refresh Token.";
              onError?.(errorMessage);
              onTokenRefreshError?.(errorMessage);
            }
            setIsRefreshing(false);
          }
        })
        .finally(() => {
          setClientAccessToken(accessToken);
        });
    }
  }, [
    accessToken,
    clientId,
    refreshUrl,
    prevAccessToken,
    onError,
    onSuccess,
    onTokenRefreshStart,
    onTokenRefreshSuccess,
    onTokenRefreshError,
  ]);

  return { isRefreshing, currentAccessToken: clientAccessToken };
};
