// // src/pages/product/ProductDetailPage.tsx
// import {
//   CheckCircle,
//   ChevronLeft,
//   ChevronRight,
//   Heart,
//   Info,
//   Minus,
//   Package,
//   Plus,
//   Share2,
//   ShoppingCart,
//   Star,
// } from "lucide-react";
// import { useState } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import { PriceDisplay } from "../../components/common/PriceDisplay";
// import { ProductGrid } from "../../components/product/ProductGrid";
// import { Button } from "../../components/ui/Button";
// import { Loading } from "../../components/ui/Loading";
// import { useAddToCartMutation } from "../../store/api/cartApi";
// import {
//   useGetProductByIdQuery,
// } from "../../store/api/productApi";

import { ProductDetail } from "../../components/admin/products/ProductDetails";

// export const ProductDetailPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const [selectedImage, setSelectedImage] = useState(0);
//   const [quantity, setQuantity] = useState(1);
//   const [activeTab, setActiveTab] = useState<
//     "description" | "specifications" | "reviews" | "details"
//   >("description");

//   const { data: product, isLoading, error } = useGetProductByIdQuery(id!);

//   // const {data: fbt_data, isLoading: fbt_loading} = useGetFrequentlyBoughtTogetherQuery({
//   //   product_id: id,
//   //   limit: 10,
//   // });
//   const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

//   const images = product?.images || [];

//   const handleAddToCart = async () => {
//     try {
//       await addToCart({
//         product_id: product.id,
//         quantity,
//       }).unwrap();
//     } catch (error) {
//       console.error("Failed to add to cart:", error);
//     }
//   };

//   const handleShare = async () => {
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: product?.name,
//           text: product?.description,
//           url: window.location.href,
//         });
//       } catch (error) {
//         console.error("Error sharing:", error);
//       }
//     } else {
//       // Fallback: copy to clipboard
//       navigator.clipboard.writeText(window.location.href);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-base-200">
//         <div className="container mx-auto px-4 py-8">
//           <Loading size="lg" text="Loading product..." fullScreen />
//         </div>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="min-h-screen bg-base-200 flex items-center justify-center">
//         <div className="card bg-base-100 shadow-xl">
//           <div className="card-body text-center">
//             <Package className="w-16 h-16 text-base-content opacity-30 mx-auto mb-4" />
//             <h2 className="card-title justify-center text-2xl text-base-content mb-4">
//               Product Not Found
//             </h2>
//             <p className="text-base-content opacity-70 mb-6">
//               The product you're looking for doesn't exist or has been removed.
//             </p>
//             <Button onClick={() => navigate("/products")} variant="primary">
//               Back to Products
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-base-200">
//       <div className="container mx-auto px-4 py-8">
//         {/* Breadcrumb */}
//         <div className="breadcrumbs text-sm text-base-content opacity-70 mb-8">
//           <ul>
//             <li>
//               <Link to="/" className="link link-hover">
//                 Home
//               </Link>
//             </li>
//             <li>
//               <Link to="/products" className="link link-hover">
//                 Products
//               </Link>
//             </li>
//             {product.category && (
//               <li>
//                 <Link
//                   to={`/products?category=${product.category.name}`}
//                   className="link link-hover"
//                 >
//                   {product.category.name}
//                 </Link>
//               </li>
//             )}
//             <li className="text-base-content">{product.name}</li>
//           </ul>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
//           {/* Product Images */}
//           <div className="space-y-4">
//             <div className="card bg-base-100 shadow-lg overflow-hidden">
//               <figure className="relative aspect-square bg-base-200">
//                 <img
//                   src={images[selectedImage] || "/placeholder.jpg"}
//                   alt={product.name}
//                   className="w-full h-full object-cover"
//                 />

//                 {images.length > 1 && (
//                   <>
//                     <button
//                       onClick={() =>
//                         setSelectedImage(Math.max(0, selectedImage - 1))
//                       }
//                       disabled={selectedImage === 0}
//                       className="btn btn-circle btn-sm absolute left-4 top-1/2 transform -translate-y-1/2 bg-base-100 hover:bg-base-200 disabled:opacity-50"
//                     >
//                       <ChevronLeft className="w-4 h-4" />
//                     </button>
//                     <button
//                       onClick={() =>
//                         setSelectedImage(
//                           Math.min(images.length - 1, selectedImage + 1)
//                         )
//                       }
//                       disabled={selectedImage === images.length - 1}
//                       className="btn btn-circle btn-sm absolute right-4 top-1/2 transform -translate-y-1/2 bg-base-100 hover:bg-base-200 disabled:opacity-50"
//                     >
//                       <ChevronRight className="w-4 h-4" />
//                     </button>
//                   </>
//                 )}

//                 {/* Stock Badge */}
//                 {!product.in_stock && (
//                   <div className="absolute top-4 left-4">
//                     <div className="badge badge-error">Out of Stock</div>
//                   </div>
//                 )}

//                 {/* Featured Badge */}
//                 {product.config?.featured && (
//                   <div className="absolute top-4 right-4">
//                     <div className="badge badge-secondary">Featured</div>
//                   </div>
//                 )}
//               </figure>
//             </div>

//             {/* {images.length > 1 && (
//               <div className="grid grid-cols-4 gap-2 ">
//                 {images.map((image: string, index: number) => (
//                   <button
//                     key={index}
//                     onClick={() => setSelectedImage(index)}
//                     className={`card bg-base-100 shadow-sm hover:shadow-md overflow-hidden transition-shadow ${
//                       selectedImage === index ? "ring-2 ring-primary" : ""
//                     }`}
//                   >
//                     <img
//                       src={image}
//                       alt={`${product.name} ${index + 1}`}
//                       className="w-full h-full object-cover overflow-hidden"
//                     />
//                   </button>
//                 ))}
//               </div>
//             )} */}
//           </div>

//           {/* Product Info */}
//           <div className="space-y-4">
//             {/* Category */}
//             {product.category && (
//               <div className="badge badge-outline text-primary border-primary">
//                 {product.category.name}
//               </div>
//             )}

//             {/* Title */}
//             <h1 className="text-3xl font-bold text-base-content">
//               {product.name}
//             </h1>

//             {product.code && (
//               <div className="text-sm text-base-content opacity-60">
//                 SKU: {product.code}
//               </div>
//             )}
//             {/* Brand */}
//             {product.brand && (
//               <p className="text-lg text-base-content opacity-70">
//                 by <span className="font-medium">{product.brand}</span>
//               </p>
//             )}

//             {/* Rating */}
//             {product.rating && (
//               <div className="flex items-center gap-2">
//                 <div className="rating rating-sm">
//                   {[...Array(5)].map((_, i) => (
//                     <input
//                       key={i}
//                       type="radio"
//                       className={`mask mask-star-2 ${
//                         i < Math.floor(product.rating!)
//                           ? "bg-warning"
//                           : "bg-base-300"
//                       }`}
//                       disabled
//                       checked={i === Math.floor(product.rating!) - 1}
//                       readOnly
//                     />
//                   ))}
//                 </div>
//                 <span className="text-base-content opacity-70">
//                   {product.rating} ({product.review_count || 0} reviews)
//                 </span>
//               </div>
//             )}

//             {/* Price */}
//             <div className="card bg-base-100 shadow-lg">
//               <div className="card-body p-4">
//                 <PriceDisplay
//                   price={product.price}
//                   originalPrice={product.original_price}
//                   currency={product.currency || "USD"}
//                   size="lg"
//                   showDiscount={true}
//                 />
//               </div>
//             </div>

//             {/* Description */}
//             {product.description && (
//               <div className="card bg-base-100 shadow-lg">
//                 <div className="card-body">
//                   <h3 className="card-title text-base-content">Description</h3>
//                   <p className="text-base-content opacity-80 leading-relaxed">
//                     {product.description}
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Stock Status */}
//             {/* <div className="alert">
//               <div className="flex items-center gap-2">
//                 <div
//                   className={`w-3 h-3 rounded-full ${
//                     product.in_stock ? "bg-success" : "bg-error"
//                   }`}
//                 />
//                 <span
//                   className={`font-medium ${
//                     product.in_stock ? "text-success" : "text-error"
//                   }`}
//                 >
//                   {product.in_stock
//                     ? `In Stock (${product.stock_quantity || 0} available)`
//                     : "Out of Stock"}
//                 </span>
//               </div>
//             </div> */}

//             {/* Product Code */}
//             {/* {product.code && (
//               <div className="text-sm text-base-content opacity-60">
//                 SKU: {product.code}
//               </div>
//             )} */}

//             {/* Quantity and Add to Cart */}
//             {product.in_stock && (
//               <div className="card bg-base-100 shadow-lg">
//                 <div className="card-body space-y-4">
//                   <div className="form-control">
//                     <label className="label">
//                       <span className="label-text font-medium text-base-content">
//                         Quantity
//                       </span>
//                     </label>
//                     <div className="flex items-center gap-3">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         shape="square"
//                         onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                         disabled={quantity <= 1}
//                       >
//                         <Minus className="w-4 h-4" />
//                       </Button>
//                       <span className="text-lg font-medium w-12 text-center text-base-content">
//                         {quantity}
//                       </span>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         shape="square"
//                         onClick={() => setQuantity(quantity + 1)}
//                         disabled={quantity >= (product.stock_quantity || 0)}
//                       >
//                         <Plus className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </div>

//                   <div className="flex gap-3">
//                     <Button
//                       onClick={handleAddToCart}
//                       loading={isAddingToCart}
//                       variant="primary"
//                       size="lg"
//                       className="flex-1"
//                       icon={<ShoppingCart className="w-5 h-5" />}
//                     >
//                       Add to Cart
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="lg"
//                       icon={<Heart className="w-5 h-5" />}
//                     />
//                     <Button
//                       variant="outline"
//                       size="lg"
//                       onClick={handleShare}
//                       icon={<Share2 className="w-5 h-5" />}
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}
//             {images.length > 1 && (
//               <div className="grid grid-cols-4 gap-2 ">
//                 {images.map((image: string, index: number) => (
//                   <button
//                     key={index}
//                     onClick={() => setSelectedImage(index)}
//                     className={`card bg-base-100 shadow-sm hover:shadow-md overflow-hidden transition-shadow ${
//                       selectedImage === index ? "ring-2 ring-primary" : ""
//                     }`}
//                   >
//                     <img
//                       src={image}
//                       alt={`${product.name} ${index + 1}`}
//                       className="w-full h-full object-cover overflow-hidden"
//                     />
//                   </button>
//                 ))}
//               </div>
//             )}
//             {/* Features */}
//             {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               <div className="card bg-base-100 shadow-sm">
//                 <div className="card-body items-center text-center p-4">
//                   <Truck className="w-6 h-6 text-primary mb-2" />
//                   <h4 className="font-medium text-sm text-base-content">
//                     Free Shipping
//                   </h4>
//                   <p className="text-xs text-base-content opacity-60">
//                     On orders over $50
//                   </p>
//                 </div>
//               </div>
//               <div className="card bg-base-100 shadow-sm">
//                 <div className="card-body items-center text-center p-4">
//                   <Shield className="w-6 h-6 text-success mb-2" />
//                   <h4 className="font-medium text-sm text-base-content">
//                     Secure Payment
//                   </h4>
//                   <p className="text-xs text-base-content opacity-60">
//                     SSL encrypted
//                   </p>
//                 </div>
//               </div>
//               <div className="card bg-base-100 shadow-sm">
//                 <div className="card-body items-center text-center p-4">
//                   <RotateCcw className="w-6 h-6 text-info mb-2" />
//                   <h4 className="font-medium text-sm text-base-content">
//                     Easy Returns
//                   </h4>
//                   <p className="text-xs text-base-content opacity-60">
//                     30-day policy
//                   </p>
//                 </div>
//               </div>
//             </div> */}
//           </div>
//         </div>

//         {/* Product Details Tabs */}
//         <div className="card bg-base-100 shadow-xl mb-8 overflow-hidden">
//           <div className="card-body p-0">
//             <div className="tabs tabs-lifted">
//               {(
//                 ["description", "specifications", "details", "reviews"] as const
//               ).map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`tab tab-lifted ${
//                     activeTab === tab ? "tab-active" : ""
//                   }`}
//                 >
//                   {tab === "description" && <Info className="w-4 h-4 mr-2" />}
//                   {tab === "specifications" && (
//                     <Package className="w-4 h-4 mr-2" />
//                   )}
//                   {tab === "details" && (
//                     <CheckCircle className="w-4 h-4 mr-2" />
//                   )}
//                   {tab === "reviews" && <Star className="w-4 h-4 mr-2" />}
//                   <span className="capitalize">{tab}</span>
//                   {tab === "reviews" && product.review_count && (
//                     <div className="badge badge-sm ml-2">
//                       {product.review_count}
//                     </div>
//                   )}
//                 </button>
//               ))}
//             </div>

//             <div className="p-8">
//               {activeTab === "description" && (
//                 <div className="prose max-w-none">
//                   <p className="text-base-content opacity-80 leading-relaxed text-lg">
//                     {product.description || "No description available."}
//                   </p>
//                   <div className="space-y-6">
//                     {product.specification && (
//                       <div>
//                         <h4 className="font-semibold text-base-content mb-3">
//                           Product Specifications
//                         </h4>
//                         <p className="text-base-content opacity-70 leading-relaxed">
//                           {product.specification}
//                         </p>
//                       </div>
//                     )}

//                     {product.technical_details && (
//                       <div>
//                         <h4 className="font-semibold text-base-content mb-3">
//                           Technical Details
//                         </h4>
//                         <p className="text-base-content opacity-70 leading-relaxed">
//                           {product.technical_details}
//                         </p>
//                       </div>
//                     )}

//                     {product.tags && product.tags.length > 0 && (
//                       <div>
//                         <h4 className="font-semibold text-base-content mb-3">
//                           Tags
//                         </h4>
//                         <div className="flex flex-wrap gap-2">
//                           {product.tags.map((tag: string, index: number) => (
//                             <div key={index} className="badge badge-outline">
//                               {tag}
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                   {product.meta_description &&
//                     product.meta_description !== product.description && (
//                       <div className="mt-4 p-4 bg-base-200 rounded-lg">
//                         <p className="text-base-content opacity-70">
//                           {product.meta_description}
//                         </p>
//                       </div>
//                     )}
//                 </div>
//               )}

//               {activeTab === "specifications" && (
//                 <div className="overflow-x-auto">
//                   <table className="table table-zebra w-full">
//                     <tbody>
//                       <tr>
//                         <td className="font-medium text-base-content">Brand</td>
//                         <td className="text-base-content opacity-70">
//                           {product.brand || "N/A"}
//                         </td>
//                       </tr>
//                       <tr>
//                         <td className="font-medium text-base-content">SKU</td>
//                         <td className="text-base-content opacity-70">
//                           {product.code}
//                         </td>
//                       </tr>
//                       <tr>
//                         <td className="font-medium text-base-content">
//                           Category
//                         </td>
//                         <td className="text-base-content opacity-70">
//                           {product.category?.name || "N/A"}
//                         </td>
//                       </tr>
//                       <tr>
//                         <td className="font-medium text-base-content">
//                           Stock Status
//                         </td>
//                         <td>
//                           <div
//                             className={`badge ${
//                               product.in_stock ? "badge-success" : "badge-error"
//                             }`}
//                           >
//                             {product.in_stock ? "In Stock" : "Out of Stock"}
//                           </div>
//                         </td>
//                       </tr>
//                       {product.stock_quantity && (
//                         <tr>
//                           <td className="font-medium text-base-content">
//                             Available Quantity
//                           </td>
//                           <td className="text-base-content opacity-70">
//                             {product.stock_quantity}
//                           </td>
//                         </tr>
//                       )}
//                       {product.product_dimensions && (
//                         <tr>
//                           <td className="font-medium text-base-content">
//                             Dimensions
//                           </td>
//                           <td className="text-base-content opacity-70">
//                             {product.product_dimensions}
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               )}

//               {activeTab === "details" && (
//                 <div className="space-y-6">
//                   {product.specification && (
//                     <div>
//                       <h4 className="font-semibold text-base-content mb-3">
//                         Product Specifications
//                       </h4>
//                       <p className="text-base-content opacity-70 leading-relaxed">
//                         {product.specification}
//                       </p>
//                     </div>
//                   )}

//                   {product.technical_details && (
//                     <div>
//                       <h4 className="font-semibold text-base-content mb-3">
//                         Technical Details
//                       </h4>
//                       <p className="text-base-content opacity-70 leading-relaxed">
//                         {product.technical_details}
//                       </p>
//                     </div>
//                   )}

//                   {product.tags && product.tags.length > 0 && (
//                     <div>
//                       <h4 className="font-semibold text-base-content mb-3">
//                         Tags
//                       </h4>
//                       <div className="flex flex-wrap gap-2">
//                         {product.tags.map((tag: string, index: number) => (
//                           <div key={index} className="badge badge-outline">
//                             {tag}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* {product.product_url && (
//                     <div>
//                       <h4 className="font-semibold text-base-content mb-3">
//                         External Link
//                       </h4>
//                       <a
//                         href={product.product_url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="link link-primary"
//                       >
//                         View on Amazon
//                       </a>
//                     </div>
//                   )} */}
//                 </div>
//               )}

//               {activeTab === "reviews" && (
//                 <div className="hero">
//                   <div className="hero-content text-center">
//                     <div>
//                       <Star className="w-16 h-16 text-base-content opacity-30 mx-auto mb-4" />
//                       <h3 className="text-xl font-bold text-base-content mb-2">
//                         No Reviews Yet
//                       </h3>
//                       <p className="text-base-content opacity-70 mb-6">
//                         Be the first to review this product and help others make
//                         informed decisions.
//                       </p>
//                       <Button variant="outline">Write a Review</Button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Recommendations */}

//         {/* {fbt_data && fbt_data.length > 0 && (
//           <div className="card bg-base-100 shadow-xl mb-8 ">
//             <div className="p-3">
//               <h2 className="text-2xl font-bold text-base-content mb-8">
//                 FBT Bought Together
//               </h2>
//               <ProductGrid
//                 products={fbt_data}
//                 columns={5}
//                 loading={fbt_loading}
//               />
//             </div>
//           </div>
//         )} */}
//       </div>
//     </div>
//   );
// };

export const ProductDetailPage: React.FC = () => {
  return <ProductDetail />;
};
