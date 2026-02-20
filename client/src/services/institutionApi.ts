import { apiSlice } from "./api";

export interface Institution {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; departments: number; exams: number };
}

export interface Department {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  _count?: { questionPools: number };
}

export interface InstitutionMember {
  id: string;
  userId: string;
  institutionId: string;
  role: "ADMIN" | "EXAMINER" | "PROCTOR" | "CANDIDATE";
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  departmentAccess: { department: { id: string; name: string } }[];
}

export const institutionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Institution CRUD
    getInstitutions: builder.query<
      {
        data: Institution[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/institutions",
        params,
      }),
      providesTags: ["Institution"],
    }),

    getInstitutionById: builder.query<{ data: Institution }, string>({
      query: (id) => `/institutions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Institution", id }],
    }),

    createInstitution: builder.mutation<
      { data: Institution },
      { name: string; code: string }
    >({
      query: (body) => ({
        url: "/institutions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Institution"],
    }),

    updateInstitution: builder.mutation<
      { data: Institution },
      { id: string; body: Partial<Institution> }
    >({
      query: ({ id, body }) => ({
        url: `/institutions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Institution"],
    }),

    // Departments
    getDepartments: builder.query<{ data: Department[] }, string>({
      query: (institutionId) => `/institutions/${institutionId}/departments`,
      providesTags: ["Department"],
    }),

    createDepartment: builder.mutation<
      { data: Department },
      { institutionId: string; body: { name: string; code: string } }
    >({
      query: ({ institutionId, body }) => ({
        url: `/institutions/${institutionId}/departments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Department"],
    }),

    updateDepartment: builder.mutation<
      { data: Department },
      { departmentId: string; body: Partial<Department> }
    >({
      query: ({ departmentId, body }) => ({
        url: `/institutions/departments/${departmentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Department"],
    }),

    deleteDepartment: builder.mutation<void, string>({
      query: (departmentId) => ({
        url: `/institutions/departments/${departmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),

    // Members
    getMembers: builder.query<
      {
        data: InstitutionMember[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      { institutionId: string; page?: number; limit?: number }
    >({
      query: ({ institutionId, ...params }) => ({
        url: `/institutions/${institutionId}/members`,
        params,
      }),
      providesTags: ["Institution"],
    }),

    addMember: builder.mutation<
      { data: InstitutionMember },
      {
        institutionId: string;
        body: { userId: string; role: string; departmentIds?: string[] };
      }
    >({
      query: ({ institutionId, body }) => ({
        url: `/institutions/${institutionId}/members`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Institution"],
    }),

    removeMember: builder.mutation<
      void,
      { institutionId: string; userId: string }
    >({
      query: ({ institutionId, userId }) => ({
        url: `/institutions/${institutionId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Institution"],
    }),

    updateMemberDepartments: builder.mutation<
      { data: unknown },
      { institutionId: string; userId: string; departmentIds: string[] }
    >({
      query: ({ institutionId, userId, departmentIds }) => ({
        url: `/institutions/${institutionId}/members/${userId}/departments`,
        method: "PUT",
        body: { departmentIds },
      }),
      invalidatesTags: ["Institution"],
    }),
  }),
});

export const {
  useGetInstitutionsQuery,
  useGetInstitutionByIdQuery,
  useCreateInstitutionMutation,
  useUpdateInstitutionMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetMembersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useUpdateMemberDepartmentsMutation,
} = institutionApi;
