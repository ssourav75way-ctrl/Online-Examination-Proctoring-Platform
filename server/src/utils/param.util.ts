/**
 * Safely extract a string parameter from Express 5 request params/query.
 * Express 5 types params as string | string[] — this ensures a string return.
 */
export const param = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};
