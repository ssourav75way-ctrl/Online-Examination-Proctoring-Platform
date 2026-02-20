
import { AuthenticatedUser, InstitutionScopedUser } from "./auth.types";

declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser;
      scopedUser?: InstitutionScopedUser;
    }
  }
}

export {};
