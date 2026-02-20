import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility to safely merge tailwind classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
