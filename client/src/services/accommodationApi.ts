import { apiSlice } from "./api";

export interface Accommodation {
  id: string;
  candidateId: string;
  type: "NONE" | "TIME_1_5X" | "TIME_2X";
  reason: string;
  approvedById: string;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  candidate?: { firstName: string; lastName: string; email: string };
  approvedBy?: { firstName: string; lastName: string };
}

export interface AccommodationAudit {
  id: string;
  accommodationId: string;
  action: "GRANTED" | "REVOKED" | "MODIFIED";
  performedById: string;
  details: string | null;
  timestamp: string;
  performedBy?: { firstName: string; lastName: string };
}

export const accommodationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    grantAccommodation: builder.mutation<
      { data: Accommodation },
      {
        candidateId: string;
        type: string;
        reason: string;
        validFrom: string;
        validUntil?: string;
      }
    >({
      query: (body) => ({
        url: "/accommodations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accommodation"],
    }),

    revokeAccommodation: builder.mutation<
      { data: null },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/accommodations/${id}/revoke`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["Accommodation"],
    }),

    modifyAccommodation: builder.mutation<
      { data: Accommodation },
      { id: string; body: Partial<Accommodation> }
    >({
      query: ({ id, body }) => ({
        url: `/accommodations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Accommodation"],
    }),

    getCandidateAccommodations: builder.query<
      { data: Accommodation[] },
      { candidateId: string }
    >({
      query: ({ candidateId }) => `/accommodations/candidate/${candidateId}`,
      providesTags: ["Accommodation"],
    }),

    getAccommodationAuditTrail: builder.query<
      {
        data: AccommodationAudit[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { page?: number; limit?: number; candidateId?: string }
    >({
      query: (params) => ({
        url: "/accommodations/audit",
        params,
      }),
      providesTags: ["Accommodation"],
    }),
  }),
});

export const {
  useGrantAccommodationMutation,
  useRevokeAccommodationMutation,
  useModifyAccommodationMutation,
  useGetCandidateAccommodationsQuery,
  useGetAccommodationAuditTrailQuery,
} = accommodationApi;
