import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks";
import { useGetCartQuery } from "../../store/api/cartApi";
import { Badge } from "../ui/Badge";

export const MiniCart: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });

  return (
    <div className="indicator">
      <ShoppingCart className="w-6 h-6" />
      {cart && cart.total_items > 0 && (
        <Badge variant="primary" size="sm" className="indicator-item">
          {cart.total_items > 99 ? "99+" : cart.total_items}
        </Badge>
      )}
    </div>
  );
};
