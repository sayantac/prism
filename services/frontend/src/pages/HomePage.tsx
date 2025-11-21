/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Truck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { BannerDisplay } from "../components/common/BannerDisplay";
import { RecommendationSection } from "../components/common/RecommendationSection";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useAuth } from "@/hooks";
import { useGetCategoriesQuery } from "../store/api/productApi";
import {
  useGetNewArrivalsQuery,
  useGetRecommendationsQuery,
  useGetTrendingProductsQuery,
  useGetUserBannersQuery,
  useGetPublishedBannersQuery,
} from "../store/api/recommendationApi";

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: trendingProducts, isLoading: trendingLoading } =
    useGetTrendingProductsQuery({ limit: 8 });
  const { data: newArrivals, isLoading: newArrivalsLoading } =
    useGetNewArrivalsQuery({ limit: 8 });
  const { data: recommendations, isLoading: recommendationsLoading } =
    useGetRecommendationsQuery(user?.id ?? "", {
      skip: !isAuthenticated || !user?.id,
    });
  const { data: userBanners } = useGetUserBannersQuery(user?.id ?? "", {
    skip: !isAuthenticated || !user?.id || isLoading,
  });
  const { data: publishedBanners } = useGetPublishedBannersQuery({ limit: 5 });
  const { data: categories } = useGetCategoriesQuery();

  const heroBanners =
    userBanners && userBanners.banners?.length
      ? userBanners.banners
      : publishedBanners?.banners || [];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast Delivery",
      description: "Quick and reliable shipping worldwide",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Payment",
      description: "Your transactions are protected",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Returns",
      description: "30-day hassle-free returns",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Best Prices",
      description: "Competitive prices guaranteed",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="hero min-h-[80vh] bg-linear-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        <div className="absolute inset-0">
          {heroBanners.length > 0 ? (
            <div className="relative h-full w-full">
              <BannerDisplay
                banners={heroBanners}
                className="h-full w-full"
                autoSlide={true}
                slideInterval={6000}
              />
              <div className="absolute inset-0 bg-linear-to-br from-black/40 via-black/10 to-black/50" />
            </div>
          ) : (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] repeat"></div>
            </div>
          )}
        </div>

        {
          heroBanners.length === 0 && (
            <div className="hero-content text-center text-primary-content relative z-10">
          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Discover Amazing Products
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-primary-content/90"
            >
              Shop the latest trends with fast delivery and secure payments
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/products">
                <Button
                  size="lg"
                  variant="accent"
                  className="text-accent-content shadow-lg hover:shadow-xl"
                >
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-content text-primary-content hover:bg-primary-content hover:text-primary"
                  >
                    Sign Up Free
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>)
        }
      </section>

      {categories && categories.length > 0 && (
        <section className="py-12 bg-base-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-base-content mb-4">
                Shop by Category
              </h2>
              <p className="text-base-content/70">
                Explore our diverse range of products
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {categories.slice(0, 6).map((category: any) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="group text-center"
                >
                  <div className="bg-base-200 rounded-xl p-4 h-36 flex flex-col items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors mb-3 shrink-0">
                      <span className="text-2xl">{category.icon || "📦"}</span>
                    </div>
                    <h3 className="font-medium text-xs leading-tight text-base-content group-hover:text-primary transition-colors text-center w-full px-1">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Personalized Recommendations */}
      {isAuthenticated &&
        recommendations &&
        recommendations.recommendations.length > 0 &&
        !recommendationsLoading && (
          <>
            <section className="py-16 bg-base-200">
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <div className="badge badge-secondary badge-lg mb-4">
                    Just for You
                  </div>
                  <h2 className="text-3xl font-bold text-base-content mb-4">
                    Recommended for You
                  </h2>
                  <p className="text-lg text-base-content/70">
                    Based on your shopping preferences
                  </p>
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
            {/* {collaborativeRecs && !collabLoading && (
              <section className="py-16 bg-base-200">
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <div className="badge badge-secondary badge-lg mb-4">
                      Just for You
                    </div>
                    <h2 className="text-3xl font-bold text-base-content mb-4">
                      Recommended for You
                    </h2>
                    <p className="text-lg text-base-content/70">
                      Based on your shopping preferences
                    </p>
                  </div>
                  <RecommendationSection
                    title="Recommended Just for You"
                    products={collaborativeRecs.recommendations}
                    isLoading={collabLoading}
                    viewAllLink="/recommendations"
                    className=""
                  />
                
                </div>
              </section>
            )} */}
          </>
        )}
      {/* Trending Products */}
      <section className="py-5 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-5">
            <div className="badge badge-primary badge-lg mb-4">
              Early Arrives
            </div>
            <h2 className="text-3xl font-bold text-base-content mb-4">
              Newly Launched Products
            </h2>
            <p className="text-lg text-base-content/70">
              Explore freshly launched products
            </p>
          </div>

          <RecommendationSection
            products={newArrivals || []}
            isLoading={newArrivalsLoading}
            viewAllLink="/new-arrivals"
            className=""
          />
          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg" variant="outline">
                View All Products
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="py-5 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-5">
            <div className="badge badge-primary badge-lg mb-4">Trending</div>
            <h2 className="text-3xl font-bold text-base-content mb-4">
              Popular Products
            </h2>
            <p className="text-lg text-base-content/70">
              Discover what's popular right now
            </p>
          </div>

          {/* <ProductGrid
            products={trendingProducts || []}
            loading={trendingLoading}
            columns={4}
          /> */}
          <RecommendationSection
            titleDiv={
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <span>Trending Now</span>
                <Badge variant="error" size="sm">
                  Hot
                </Badge>
              </div>
            }
            products={trendingProducts || []}
            isLoading={trendingLoading}
            viewAllLink="/trending"
            className="bg-base-100"
          />

          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg" variant="outline">
                View All Products
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-base-content mb-2">
                Products
              </h1>
              <p className="text-base-content">
                {productsData?.total || 0} products found
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-base-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ProductGrid
            products={productsData?.items || []}
            loading={isLoading}
            columns={5}
          />

          {productsData && productsData.pages > page && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setPage(page + 1)}
                variant="outline"
                size="lg"
              >
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </section> */}
      {/* Features */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body items-center text-center p-6">
                  <div
                    className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center ${feature.color} mb-4`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="card-title text-base font-semibold text-base-content mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-base-content/70">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-primary text-primary-content">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Shopping?
              </h2>
              <p className="text-xl mb-8 text-primary-content/90">
                Join thousands of happy customers and get exclusive deals
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" variant="accent" className="shadow-lg">
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-content text-primary-content hover:bg-primary-content hover:text-primary"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
