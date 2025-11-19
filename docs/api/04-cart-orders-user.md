# 🛒 Cart & Orders, User & Behavior API - Quick Reference

Complete documentation for cart management, order processing, user profiles, wishlist, and behavior tracking.

---

## 🛒 Cart API (`/api/v1/cart`)

### Cart Operations
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/cart` | GET | Get user's cart | ✅ Required |
| `/cart/items` | POST | Add item to cart | ✅ Required |
| `/cart/items/{product_id}` | PUT | Update item quantity | ✅ Required |
| `/cart/items/{product_id}` | DELETE | Remove item from cart | ✅ Required |
| `/cart/clear` | DELETE | Clear entire cart | ✅ Required |

### Example: Add to Cart
```json
POST /api/v1/cart/items
{
  "product_id": "550e8400-...",
  "quantity": 2,
  "variant_id": "var-001"
}

Response:
{
  "cart_id": "cart-123",
  "items": [...],
  "subtotal": 599.98,
  "tax": 47.99,
  "total": 647.97,
  "item_count": 3
}
```

---

## 📦 Orders API (`/api/v1/orders`)

### Order Operations
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/orders` | POST | Create order from cart | ✅ Required |
| `/orders` | GET | List user's orders | ✅ Required |
| `/orders/{order_id}` | GET | Get order details | ✅ Required |
| `/orders/{order_id}/cancel` | POST | Cancel order | ✅ Required |

### Example: Create Order
```json
POST /api/v1/orders
{
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "US"
  },
  "payment_method": "credit_card",
  "delivery_instructions": "Leave at door"
}

Response:
{
  "id": "order-789",
  "order_number": "ORD-2025-001234",
  "status": "pending",
  "items": [
    {
      "product_id": "...",
      "product_name": "Wireless Headphones",
      "quantity": 1,
      "price": 299.99
    }
  ],
  "subtotal": 299.99,
  "tax": 23.99,
  "shipping": 0.00,
  "total": 323.98,
  "created_at": "2025-11-12T10:30:00Z",
  "estimated_delivery": "2025-11-15"
}
```

### Order Statuses
- `pending` → `processing` → `shipped` → `delivered`
- `cancelled` (can cancel before shipping)

---

## 👤 User & Profile API (`/api/v1/users`)

### Profile Operations
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/users/profile` | GET | Get user profile | ✅ Required |
| `/users/profile` | PUT | Update profile | ✅ Required |

---

## ❤️ Wishlist API (`/api/v1/wishlist`)

### Wishlist Operations
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/wishlist` | GET | Get user's wishlist | ✅ Required |
| `/wishlist/{product_id}` | POST | Add to wishlist | ✅ Required |
| `/wishlist/{product_id}` | DELETE | Remove from wishlist | ✅ Required |

### Example: Get Wishlist
```json
GET /api/v1/wishlist

Response:
{
  "items": [
    {
      "product_id": "prod-123",
      "product": {
        "name": "Smart Watch",
        "price": 399.99,
        "images": ["..."],
        "in_stock": true
      },
      "added_at": "2025-11-10T15:00:00Z"
    }
  ],
  "total_items": 5
}
```

---

## 📊 User Behavior API (`/api/v1/user/behavior`)

Track user interactions for better recommendations.

### Behavior Operations
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/user/behavior/stats` | GET | Get behavior statistics | ✅ Required |
| `/user/behavior/interests` | GET | Get user interests | ✅ Required |
| `/user/behavior/categories/frequent` | GET | Most viewed categories | ✅ Required |
| `/user/behavior/interests/update` | POST | Update interests | ✅ Required |
| `/user/behavior/recommendations/behavior-based` | GET | Recommendations based on behavior | ✅ Required |

### Example: Behavior Stats
```json
GET /api/v1/user/behavior/stats

Response:
{
  "total_views": 234,
  "total_purchases": 12,
  "total_cart_adds": 45,
  "avg_session_duration": 320,
  "favorite_categories": ["Electronics", "Books"],
  "price_range_preference": {
    "min": 50,
    "max": 500
  },
  "browsing_patterns": {
    "peak_hours": [10, 15, 20],
    "peak_days": ["Saturday", "Sunday"]
  }
}
```

---

## 🔔 Notifications API (`/api/v1/notifications`)

### Notification Operations
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/notifications` | GET | List notifications | ✅ Required |
| `/notifications/{id}/read` | POST | Mark as read | ✅ Required |
| `/notifications/mark-all-read` | POST | Mark all read | ✅ Required |
| `/notifications/unread-count` | GET | Get unread count | ✅ Required |

### Notification Types
- `order_update` - Order status changes
- `price_drop` - Wishlist item price drop
- `back_in_stock` - Wishlist item restocked
- `recommendation` - New personalized recommendations
- `promotion` - Special offers

---

## 🎯 Usage Examples

### Complete Shopping Flow
```javascript
// 1. Browse & Add to Cart
await fetch('/api/v1/cart/items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: 'prod-123',
    quantity: 1
  })
});

// 2. View Cart
const cart = await fetch('/api/v1/cart', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Create Order
const order = await fetch('/api/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    shipping_address: {...},
    payment_method: 'credit_card'
  })
});

// 4. Track Order
const orderDetails = await fetch(`/api/v1/orders/${orderId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Wishlist & Recommendations
```javascript
// Add to wishlist
await fetch(`/api/v1/wishlist/${productId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get wishlist
const wishlist = await fetch('/api/v1/wishlist', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get behavior-based recommendations
const recommendations = await fetch(
  '/api/v1/user/behavior/recommendations/behavior-based?limit=10',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

## 📝 Important Notes

### Cart Behavior
- Cart persists across sessions
- Items automatically removed if out of stock
- Prices updated in real-time
- Quantity limits enforced

### Order Processing
- Orders created from current cart
- Cart cleared after successful order
- Payment processed externally
- Email confirmation sent

### Wishlist Features
- Unlimited items
- Notifications for price drops
- Notifications when back in stock
- Can move items to cart

### Behavior Tracking
- Automatically tracks: views, clicks, searches
- Manual tracking for custom events
- Privacy-compliant (opt-out available)
- Used for personalization

---

## 🔐 Security

All endpoints require valid Bearer token except:
- Public product listings
- Product search
- Product details

Rate limits apply:
- 500 requests/minute for authenticated users
- 100 requests/minute for anonymous users
