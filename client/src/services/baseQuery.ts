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


export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = localStorage.getItem(
          CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN,
        );
        if (refreshToken) {
          
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
            
            const data = refreshResult.data as {
              data: { accessToken: string; refreshToken: string };
            };

            
            localStorage.setItem(
              CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN,
              data.data.refreshToken,
            );

            
            const currentUser = (api.getState() as RootState).auth.user;
            if (currentUser) {
              api.dispatch(
                setCredentials({
                  user: currentUser,
                  accessToken: data.data.accessToken,
                }),
              );
            }

            
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
      
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }
  return result;
};
