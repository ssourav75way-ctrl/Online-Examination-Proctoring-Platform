import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";
import { CONSTANTS } from "@/constants";
import { RootState } from "@/store";
import { logout, setCredentials } from "@/store/slices/authSlice";

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: CONSTANTS.API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token =
      (getState() as RootState).auth.accessToken ||
      localStorage.getItem(CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Custom base query with built-in token refresh mutex rotation.
 * Follows strict error isolation and intercepts 401 Unauthorized responses.
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait until the mutex is available without locking it
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Checking whether the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = localStorage.getItem(
          CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN,
        );
        if (refreshToken) {
          // Attempt to refresh token
          const refreshResult = await baseQuery(
            {
              url: "/auth/refresh",
              method: "POST",
              body: { refreshToken },
            },
            api,
            extraOptions,
          );

          if (refreshResult.data) {
            // Add robust typing explicitly for the response
            const data = refreshResult.data as {
              data: { accessToken: string; refreshToken: string };
            };

            // Store new refresh token
            localStorage.setItem(
              CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN,
              data.data.refreshToken,
            );

            // Let Redux know we got a new access token without wiping user data
            const currentUser = (api.getState() as RootState).auth.user;
            if (currentUser) {
              api.dispatch(
                setCredentials({
                  user: currentUser,
                  accessToken: data.data.accessToken,
                }),
              );
            }

            // Retry the initial query
            result = await baseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logout());
            localStorage.removeItem(CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
          }
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      // Wait until the mutex is available without locking it
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }
  return result;
};
