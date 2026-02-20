import { apiSlice } from "./api";
import { User } from "@/types/auth";

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ data: LoginResponse }, Record<string, string>>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    getProfile: builder.query<{ data: User }, undefined>({
      query: () => "/users/profile",
      providesTags: ["User"],
    }),

    logout: builder.mutation<
      { success: boolean; message: string },
      { refreshToken: string }
    >({
      query: (body) => ({
        url: "/auth/logout",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useLoginMutation, useGetProfileQuery, useLogoutMutation } =
  authApi;
