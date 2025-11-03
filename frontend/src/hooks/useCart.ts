/* eslint-disable no-useless-catch */
// src/hooks/useCart.ts - Updated for new API endpoints
import { useSelector } from "react-redux";
import {
  useAddToCartMutation,
  useClearCartMutation,
  useGetCartQuery,
  useRemoveFromCartMutation,
  useUpdateCartItemMutation,
} from "../store/api/cartApi";
import type { RootState } from "../store/store";
import { useAuth } from "./useAuth";

export const useCart = () => {
  const { isAuthenticated } = useAuth();
  const { cartDrawerOpen } = useSelector((state: RootState) => state.ui);

  const {
    data: cart,
    isLoading,
    error,
  } = useGetCartQuery(undefined, { skip: !isAuthenticated });

  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const [updateCartItem, { isLoading: isUpdating }] =
    useUpdateCartItemMutation();
  const [removeCartItem, { isLoading: isRemoving }] =
    useRemoveFromCartMutation();
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const itemCount = cart?.total_items || 0;
  const subtotal = cart?.subtotal || 0;
  const items = cart?.items || [];

  const addItem = async (productId: string, quantity: number = 1) => {
    try {
      await addToCart({ product_id: productId, quantity }).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const updateItem = async (itemId: string, quantity: number) => {
    try {
      await updateCartItem({ itemId: itemId, quantity }).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await removeCartItem(itemId).unwrap();
    } catch (error) {
      throw error;
    }
  };

  const clear = async () => {
    try {
      await clearCart({}).unwrap();
    } catch (error) {
      throw error;
    }
  };

  return {
    cart,
    items,
    itemCount,
    subtotal,
    isLoading,
    error,
    cartDrawerOpen,
    addItem,
    updateItem,
    removeItem,
    clear,
    isAdding,
    isUpdating,
    isRemoving,
    isClearing,
  };
};
