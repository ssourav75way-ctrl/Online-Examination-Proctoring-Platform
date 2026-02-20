import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

/**
 * The central RTK Query API slice.
 * We inject endpoints in separate files for code splitting.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Question",
    "QuestionPool",
    "Exam",
    "ExamSession",
    "Result",
    "Institution",
    "Department",
    "Proctor",
    "Notification",
    "Accommodation",
    "Analytics",
  ],
  endpoints: () => ({}),
});
