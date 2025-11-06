/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarOpen: boolean;
  cartDrawerOpen: boolean;
  quickViewProduct: any | null;
  loading: Record<string, boolean>;
  theme: "light" | "dark";
  adminSidebarOpen: boolean;
  adminActiveTab: string;
  searchQuery: string;
}

const initialState: UiState = {
  sidebarOpen: true,
  cartDrawerOpen: false,
  adminSidebarOpen: true,
  adminActiveTab: "dashboard",
  quickViewProduct: null,
  loading: {},
  theme: (localStorage.getItem("theme") as "light" | "dark") || "light",
  searchQuery: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleCartDrawer: (state) => {
      state.cartDrawerOpen = !state.cartDrawerOpen;
    },
    setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.cartDrawerOpen = action.payload;
    },
    setQuickViewProduct: (state, action: PayloadAction<any | null>) => {
      state.quickViewProduct = action.payload;
    },
    setLoading: (
      state,
      action: PayloadAction<{ key: string; loading: boolean }>
    ) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.theme);
    },
    setAdminSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.adminSidebarOpen = action.payload;
    },
    setAdminActiveTab: (state, action: PayloadAction<string>) => {
      state.adminActiveTab = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleCartDrawer,
  setCartDrawerOpen,
  setQuickViewProduct,
  setLoading,
  toggleTheme,
  setAdminSidebarOpen,
  setAdminActiveTab,
  setSearchQuery,
} = uiSlice.actions;

export default uiSlice.reducer;
