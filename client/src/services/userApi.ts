import { apiSlice } from "./api";

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: string;
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchCandidate: builder.query<{ data: UserSummary | null }, string>({
      query: (email) => ({
        url: "/users/search",
        params: { email },
      }),
      providesTags: ["User"],
    }),
  }),
});

export const { useSearchCandidateQuery, useLazySearchCandidateQuery } = userApi;
