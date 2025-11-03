/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Heart,
  RefreshCw,
  Share2,
  Shield,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useAddToCartMutation } from "../../../store/api/cartApi";
import { useGetProductByIdQuery } from "../../../store/api/productApi";
import {
  useGetFBTProductsQuery,
  useGetRecommendationsQuery,
  useGetRelatedProductsQuery,
} from "../../../store/api/recommendationApi";
import { ImageGallery } from "../../common/ImageGallery";
import { PriceDisplay } from "../../common/PriceDisplay";
import { RecommendationSection } from "../../common/RecommendationSection";
import { ProductCarousel } from "../../product/ProductCarousel";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Loading } from "../../ui/Loading";

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [sponseredData, setSponseredData] = useState();
  const { isAuthenticated, user } = useAuth();

  const { data: product, isLoading } = useGetProductByIdQuery(id!);
  // const { data: productCartRecommendations,isLoading: isCartRecommendationsLoading } =
  //   useGetCartRecommendationsQuery(user.id, { skip: !user?.id });
  const { data: relatedProducts } = useGetRelatedProductsQuery(
    { id: id, limit: 8 },
    {
      skip: !id,
    }
  );
  const { data: fbtProducts, isLoading: fbtLoading } = useGetFBTProductsQuery(
    { id: id, limit: 8 },
    {
      skip: !id,
    }
  );
  const handleSponserSearch = (newQuery: string) => {
    const myHeaders = new Headers();
    myHeaders.append("accept", "application/json");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch(
      `http://127.0.0.1:8003/sponsored-search?query=${newQuery}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => setSponseredData(result));
  };

  useEffect(() => {
    if (product && product.name) {
      handleSponserSearch(product.name);
    }
  }, [product]);

  const { data: recommendations, isLoading: recommendationsLoading } =
    useGetRecommendationsQuery(user?.id, {
      skip: !isAuthenticated || !user?.id,
    });

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      await addToCart({ product_id: id!, quantity }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error("Failed to add item to cart");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-base-content/70">
            The product you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <ImageGallery images={product.images} alt={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Category */}
            <div className="flex items-center space-x-2">
              {product.brand && (
                <Badge variant="secondary">{product.brand}</Badge>
              )}
              {product.category && (
                <Badge variant="accent">{product.category.name}</Badge>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-base-content">
              {product.name}
            </h1>

            {/* Price */}
            <div>
              <PriceDisplay
                price={product?.price}
                originalPrice={product?.original_price}
                size="lg"
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-base-content/80 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            {product.specifications && (
              <div>
                <h3 className="font-semibold mb-2">Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-base-content/70">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Options */}
            {product.variants && (
              <div className="space-y-4">
                {/* Size Selection */}
                {product.variants.sizes && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.sizes.map((size: string) => (
                        <Button
                          key={size}
                          variant={
                            selectedSize === size ? "primary" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.variants.colors && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.colors.map((color: string) => (
                        <Button
                          key={color}
                          variant={
                            selectedColor === color ? "primary" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 border border-base-300 rounded text-center min-w-[60px]">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= (product.stock_quantity || 10)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!product.in_stock || isAddingToCart}
                  loading={isAddingToCart}
                  icon={<ShoppingCart className="w-5 h-5" />}
                  className="flex-1"
                >
                  {product.in_stock ? "Add to Cart" : "Out of Stock"}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  icon={<Heart className="w-5 h-5" />}
                  className="btn-square"
                />

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                  icon={<Share2 className="w-5 h-5" />}
                  className="btn-square"
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-base-200">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-primary" />
                <span className="text-sm">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">Warranty</span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                <span className="text-sm">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isAuthenticated &&
        recommendations &&
        recommendations.recommendations.length > 0 &&
        !recommendationsLoading && (
          <section className="py-8 bg-base-300">
            <div className="container mx-auto px-2">
              <div className="text-center mb-6  ">
                <div className="badge badge-secondary badge-lg mb-4">
                  Just for You
                </div>
                <h2 className="text-3xl font-bold text-base-content mb-4">
                  You might like it!
                </h2>
                {/* <p className="text-lg text-base-content/70">
                  Based on your shopping preferences
                </p> */}
              </div>
              <RecommendationSection
                title="Recommended Just for You"
                products={recommendations.recommendations}
                isLoading={recommendationsLoading}
                viewAllLink="/recommendations"
                className=""
              />
              {/* <ProductGrid
                    products={recommendations}
                    loading={recommendationsLoading}
                    columns={4}
                  /> */}
            </div>
          </section>
        )}
      {/* {sponseredData && (sponseredData as any[]).length > 0 && (
        <ProductCarousel products={sponseredData} itemsPerView={5} />
      )} */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="py-8 bg-base-200">
          <div className="container mx-auto px-2">
            <div className="text-center mb-6  ">
              <h2 className="text-2xl font-bold text-base-content mb-2">
                Sponsored Product
                {/* <span className="text-primary">
                  {(product.name as string).split(",")[0]}
                </span> */}
              </h2>
              {/* <p className="text-lg text-base-content/70">
                Based on content similarity
              </p> */}
            </div>
            {sponseredData && (sponseredData as any[]).length > 0 && (
              <ProductCarousel products={sponseredData} itemsPerView={5} />
            )}
          </div>
        </section>
      )}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="py-8 bg-base-100">
          <div className="container mx-auto px-2">
            <div className="text-center mb-6  ">
              <h2 className="text-2xl font-bold text-base-content mb-2">
                Similar Products to{" "}
                <span className="text-primary">
                  {(product.name as string).split(",")[0]}
                </span>
              </h2>
              {/* <p className="text-lg text-base-content/70">
                Based on content similarity
              </p> */}
            </div>
            <RecommendationSection
              title="Recommended Just for You"
              products={relatedProducts}
              isLoading={recommendationsLoading}
              viewAllLink="/recommendations"
              className=""
            />
            {/* <ProductGrid
                    products={recommendations}
                    loading={recommendationsLoading}
                    columns={4}
                  /> */}
          </div>
        </section>
      )}
      {fbtProducts && fbtProducts.recommendations.length > 0 && (
        <section className="py-8 bg-base-300">
          <div className="container mx-auto px-2">
            <div className="text-center mb-6  ">
              <h2 className="text-2xl font-bold text-base-content mb-2">
                Frequently bought along with{" "}
                <span className="text-primary">
                  {(product.name as string).split(",")[0]}
                </span>
              </h2>
              {/* <p className="text-lg text-base-content/70">
                Based on content similarity
              </p> */}
            </div>
            <RecommendationSection
              title="Related Products"
              products={fbtProducts.recommendations}
              limit={5}
              isLoading={fbtLoading}
            />
            {/* <ProductGrid
                    products={recommendations}
                    loading={recommendationsLoading}
                    columns={4}
                  /> */}
          </div>
        </section>
      )}
    </div>
  );
};
