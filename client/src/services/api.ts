import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Question",
    "QuestionPool",
    "Exam",
    "ExamQuestion",
    "ExamSession",
    "Result",
    "Institution",
    "Department",
    "Proctor",
    "Notification",
    "Accommodation",
    "Analytics",
    "ExamMarkers",
    "Auth",
  ],
  endpoints: () => ({}),
});
