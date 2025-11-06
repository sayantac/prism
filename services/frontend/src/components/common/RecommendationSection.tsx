/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement } from "react";
import { ProductCard } from "../product/ProductCard";
import { EmptyState } from "./EmptyState";
import { LoadingCard } from "./LoadingCard";

interface RecommendationSectionProps {
  title?: string;
  titleDiv?: ReactElement;
  products: any[];
  isLoading?: boolean;
  viewAllLink?: string;
  className?: string;
  limit?: number;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  titleDiv,
  products,
  isLoading = false,
  viewAllLink,
  className = "",
  limit = 5,
}) => {
  const handleproducts = (productss: any[], limitt: number) => {
    if (productss.length > limitt) {
      return productss?.slice(0, limitt);
    } else {
      return productss;
    }
  };
  const displayProducts = handleproducts(products, limit);

  return (
    <section className={`py-4 ${className}`}>
      <div className="container mx-auto px-4">
        {titleDiv ? (
          <>{titleDiv}</>
        ) : (
          <div className="flex justify-between items-center mb-6 hidden">
            {/* <div>
              <h2 className="text-2xl font-bold text-base-content">{title}</h2>
              <p className="text-base-content/70 mt-1">
                {products?.length > 0 && `${products.length} items available`}
              </p>
            </div> */}
            {/* {viewAllLink && products?.length > limit && (
              <Link to={viewAllLink}>
                <Button
                  variant="ghost"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  View All
                </Button>
              </Link>
            )} */}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5  gap-6">
          {isLoading ? (
            Array.from({ length: limit }).map((_, index) => (
              <LoadingCard key={index} />
            ))
          ) : displayProducts.length > 0 ? (
            displayProducts.map((item: any) => (
              <ProductCard
                key={item.product?.id || item.id}
                product={item.product || item}
                recommendation={
                  item.algorithm
                    ? {
                        score: item.score,
                        algorithm: item.algorithm,
                        explanation: item.explanation,
                      }
                    : undefined
                }
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                title="No recommendations available"
                description="We're working on finding the perfect products for you."
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
