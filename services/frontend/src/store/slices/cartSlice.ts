import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: string;
    name: string;
    images: string[];
    in_stock: boolean;
    price: number;
  };
}

interface CartState {
  items: CartItem[];
  total_items: number;
  subtotal: number;
  item_count: number;
}

const initialState: CartState = {
  items: [],
  total_items: 0,
  subtotal: 0,
  item_count: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<CartState>) => {
      return action.payload;
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.product_id === action.payload.product_id
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
        existingItem.total_price =
          existingItem.quantity * existingItem.unit_price;
      } else {
        state.items.push(action.payload);
      }

      state.total_items = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.subtotal = state.items.reduce(
        (total, item) => total + item.total_price,
        0
      );
      state.item_count = state.items.length;
    },
    updateItemQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (item) => item.id === action.payload.itemId
      );
      if (item) {
        item.quantity = action.payload.quantity;
        item.total_price = item.quantity * item.unit_price;

        state.total_items = state.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
        state.subtotal = state.items.reduce(
          (total, item) => total + item.total_price,
          0
        );
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.total_items = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      state.subtotal = state.items.reduce(
        (total, item) => total + item.total_price,
        0
      );
      state.item_count = state.items.length;
    },
    clearCart: (state) => {
      state.items = [];
      state.total_items = 0;
      state.subtotal = 0;
      state.item_count = 0;
    },
  },
});

export const { setCart, addItem, updateItemQuantity, removeItem, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
