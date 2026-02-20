import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types/auth";
import { CONSTANTS } from "@/constants";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  effectiveRole: string | null;
}

function resolveEffectiveRole(user: User | null): string | null {
  if (!user) return null;

  // SUPER_ADMIN is always SUPER_ADMIN globally
  if (user.globalRole === "SUPER_ADMIN") return "SUPER_ADMIN";

  // If user has institution memberships, use the first membership's role
  if (user.institutionMembers && user.institutionMembers.length > 0) {
    return user.institutionMembers[0].role;
  }

  // Fallback to globalRole (CANDIDATE)
  return user.globalRole;
}

const savedUser = localStorage.getItem("oep_user");
const savedAccessToken = localStorage.getItem(
  CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN,
);
const parsedUser: User | null = savedUser ? JSON.parse(savedUser) : null;

const initialState: AuthState = {
  user: parsedUser,
  isAuthenticated: !!savedAccessToken,
  accessToken: savedAccessToken,
  effectiveRole: resolveEffectiveRole(parsedUser),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.effectiveRole = resolveEffectiveRole(action.payload.user);

      localStorage.setItem("oep_user", JSON.stringify(action.payload.user));
      localStorage.setItem(
        CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN,
        action.payload.accessToken,
      );
    },
    updateUserProfile: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.effectiveRole = resolveEffectiveRole(action.payload);
      localStorage.setItem("oep_user", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.effectiveRole = null;

      // Clear persistence
      localStorage.removeItem("oep_user");
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.REFRESH_TOKEN);
    },
  },
});

export const { setCredentials, updateUserProfile, logout } = authSlice.actions;
export default authSlice.reducer;
