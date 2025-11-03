import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    apartment?: string;
    address_type: string;
  };
  roles: Array<{ id: string; name: string }>;
  permissions: string[];
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),
  isAuthenticated: !!localStorage.getItem("access_token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        access_token: string;
        refresh_token?: string;
        user: User;
      }>
    ) => {
      const { access_token, refresh_token, user } = action.payload;
      state.token = access_token;
      state.refreshToken = refresh_token || null;
      state.user = user;
      state.isAuthenticated = true;

      localStorage.setItem("access_token", access_token);
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
