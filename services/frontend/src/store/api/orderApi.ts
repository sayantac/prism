import { apiSlice } from "./apiSlice";

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params = {}) => ({
        url: "/orders",
        params,
      }),
      providesTags: ["Order"],
    }),
    getOrderById: builder.query({
      query: (id: string) => `/orders/${id}`,
      providesTags: (_result, _error, id) =>
        id ? [{ type: "Order", id }] : [{ type: "Order" }],
    }),
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/orders/",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Order", "Cart"],
    }),
    cancelOrder: builder.mutation({
      query: (orderId: string) => ({
        url: `/orders/${orderId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Order"],
    }),
    requestReturn: builder.mutation({
      query: ({ orderId, reason }: { orderId: string; reason: string }) => ({
        url: `/orders/${orderId}/return`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useRequestReturnMutation,
} = orderApi;
