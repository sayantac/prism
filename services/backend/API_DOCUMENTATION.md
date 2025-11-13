# Complete E-commerce Recommendation System - API Documentation

## Overview

This is a comprehensive AI-powered e-commerce backend built with FastAPI, featuring:

- **AI-Powered Recommendations** with multiple algorithms (collaborative, content-based, hybrid, FBT)
- **Advanced Search** (text + vector similarity using AWS Bedrock embeddings)
- **Customer Segmentation** (RFM analysis with ML clustering)
- **Personalized Promotions** with Google Gemini AI & Imagen integration
- **ML Model Management** with admin console and training orchestration
- **Comprehensive Analytics** & KPI tracking with detailed dashboards
- **Real-time Recommendation Tracking** and performance metrics
- **User Behavior Analytics** with funnel analysis and cohort retention
- **Explainable AI** with natural language explanations for recommendations
- **Image Generation** for marketing banners using Google Imagen
- **Advanced User Segmentation** with rule engines and auto-updating segments

**Base URL:** `http://localhost:8000`
**Documentation URL:** `http://localhost:8000/docs` (Swagger UI)
**Alternative Docs:** `http://localhost:8000/redoc` (ReDoc)

**Version:** 2.0.0
**Last Updated:** 2025-01-13

---

# 📱 SECTION 1: NORMAL USER APIs

These APIs are designed for customer-facing applications (web, mobile apps, etc.)

## 🔐 Authentication

### Register User
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "username": "john_doe",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "US",
    "apartment": "Apt 4B",
    "landmark": "Near Central Park",
    "address_type": "home"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "message": "User registered successfully"
}
```

### Check Username Availability
```http
POST /api/v1/auth/check-username?username=john_doe
```

**Response:**
```json
{
  "available": true,
  "message": "Username is available"
}
```

### User Login
```http
POST /api/v1/auth/login
```

**Request Body (Form Data):**
```
username: user@example.com  // Can be email or username
password: securepassword123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

## 👤 User Profile Management

### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "US",
    "apartment": "Apt 4B",
    "address_type": "home"
  },
  "is_active": true,
  "roles": [
    {"id": "uuid", "name": "customer"}
  ],
  "permissions": ["products.view", "cart.manage", "orders.view"]
}
```

### Update User Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "gender": "male",
  "address": {
    "street": "456 New Street",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90210",
    "country": "US",
    "address_type": "home"
  }
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

### Update Username
```http
PUT /api/v1/users/username
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "john_smith"
}
```

**Response:**
```json
{
  "message": "Username updated successfully",
  "username": "john_smith"
}
```

### Update User Address
```http
PUT /api/v1/users/address
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "street": "789 Oak Avenue",
  "city": "Chicago",
  "state": "IL",
  "zip_code": "60601",
  "country": "US",
  "apartment": "Unit 12",
  "landmark": "Near Willis Tower",
  "address_type": "work"
}
```

**Response:**
```json
{
  "message": "Address updated successfully"
}
```

### Update User Preferences
```http
POST /api/v1/users/preferences
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "price_range": "premium",
  "brand_preference": "brand_loyal",
  "interests": ["electronics", "fashion", "home"],
  "categories": ["smartphones", "laptops"],
  "newsletter_subscription": true
}
```

**Response:**
```json
{
  "message": "Preferences updated successfully"
}
```

## 👁️ Recently Viewed Products

### Get Recently Viewed Products
```http
GET /api/v1/users/viewed-products?limit=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "viewed_products": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "price": 999.99,
      "brand": "Apple",
      "images": ["https://example.com/image1.jpg"],
      "in_stock": true,
      "is_active": true
    }
  ]
}
```

### Add Product to Viewed History
```http
POST /api/v1/users/viewed-products/{product_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Product added to viewed history"
}
```

### Clear Viewed Products History
```http
DELETE /api/v1/users/viewed-products
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Viewed products history cleared"
}
```

## 🛍️ Products

### Get Products (with Filtering & Pagination)
```http
GET /api/v1/products?page=1&size=20&category=Electronics&brand=Apple&min_price=100&max_price=1000&in_stock=true&sort_by=price&sort_order=asc
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `size` (integer): Items per page (1-100, default: 20)
- `category` (string): Filter by category name
- `brand` (string): Filter by brand
- `min_price` (float): Minimum price filter
- `max_price` (float): Maximum price filter
- `in_stock` (boolean): Filter by stock availability
- `sort_by` (string): Sort field (name|price|created_at|popularity)
- `sort_order` (string): Sort direction (asc|desc)
- `search_term` (string): Search in name, description, brand

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "code": "IP15P-128",
      "brand": "Apple",
      "price": 999.99,
      "description": "Latest iPhone with A17 Pro chip",
      "images": ["https://example.com/image1.jpg"],
      "in_stock": true,
      "stock_quantity": 50,
      "category": {
        "id": "uuid",
        "name": "Smartphones"
      },
      "tags": ["smartphone", "ios", "5g"]
    }
  ],
  "total": 150,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

### Get Product by ID (Auto-tracks viewing)
```http
GET /api/v1/products/{product_id}
Authorization: Bearer {token} (optional)
```

**Note:** If user is authenticated, this automatically adds the product to their viewed history.

**Response:**
```json
{
  "id": "uuid",
  "name": "iPhone 15 Pro",
  "code": "IP15P-128",
  "brand": "Apple",
  "price": 999.99,
  "compare_price": 1099.99,
  "description": "Latest iPhone with A17 Pro chip...",
  "specification": {
    "screen": "6.1 inch Super Retina XDR",
    "storage": "128GB",
    "camera": "48MP Main"
  },
  "technical_details": {
    "dimensions": "146.6 x 70.6 x 8.25 mm",
    "weight": "187g"
  },
  "images": ["https://example.com/image1.jpg"],
  "in_stock": true,
  "stock_quantity": 50,
  "category": {
    "id": "uuid",
    "name": "Smartphones"
  },
  "tags": ["smartphone", "ios", "5g"],
  "meta_title": "iPhone 15 Pro - Latest Technology",
  "meta_description": "Experience the power of A17 Pro..."
}
```

### Get Similar Products
```http
GET /api/v1/products/{product_id}/similar?limit=10
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "iPhone 15",
    "price": 799.99,
    "similarity_score": 0.92,
    "reason": "vector_similarity"
  }
]
```

### Get Frequently Bought Together
```http
GET /api/v1/products/{product_id}/frequently-bought-together?limit=5
```

**Response:**
```json
{
  "product_id": "uuid",
  "frequently_bought_together": [
    {
      "product_id": "uuid",
      "product_name": "iPhone Case",
      "price": 29.99,
      "confidence": 0.85,
      "lift": 2.3,
      "in_stock": true,
      "product": { /* full product object */ }
    }
  ]
}
```

### Get Product Categories
```http
GET /api/v1/products/categories/
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and gadgets",
    "children": [
      {
        "id": "uuid",
        "name": "Smartphones",
        "slug": "smartphones",
        "parent_id": "parent_uuid",
        "children": []
      }
    ]
  }
]
```

## 🔍 Search

### Search Products (Advanced)
```http
GET /api/v1/search/?q=smartphone&category_id=uuid&brand[]=Apple&brand[]=Samsung&price_min=200&price_max=1500&in_stock=true&sort_by=relevance&page=1&page_size=20
```

**Query Parameters:**
- `q` (string, required): Search query
- `category_id` (string): Filter by category ID
- `brand[]` (array): Filter by brands (multiple values)
- `price_min` (float): Minimum price
- `price_max` (float): Maximum price
- `in_stock` (boolean): Filter by stock status
- `sort_by` (string): Sort by (relevance|price_low|price_high|name|newest)
- `page` (integer): Page number
- `page_size` (integer): Results per page (1-100)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "price": 999.99,
      "relevance_score": 0.95,
      "match_reason": "title_brand_match",
      "in_stock": true,
      "product": { /* full product object */ }
    }
  ],
  "total_count": 145,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "response_time_ms": 234,
  "search_suggestions": [
    "smartphone cases",
    "smartphone accessories"
  ]
}
```

### Get Search Suggestions
```http
GET /api/v1/search/suggestions?q=smart&limit=5
```

**Response:**
```json
{
  "suggestions": [
    "smartphone",
    "smart watch",
    "smart home",
    "smart tv"
  ]
}
```

### Track Search Click
```http
POST /api/v1/search/track-click
```

**Request Body:**
```json
{
  "search_id": "uuid",
  "product_id": "uuid",
  "position": 3
}
```

## 🛒 Shopping Cart

### Add Item to Cart
```http
POST /api/v1/cart/add
Authorization: Bearer {token} (optional for guest users)
```

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "quantity": 2,
  "unit_price": 999.99,
  "total_price": 1999.98,
  "created_at": "2025-01-27T10:30:00Z"
}
```

### Get Cart Contents
```http
GET /api/v1/cart/
Authorization: Bearer {token} (optional for guest users)
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 999.99,
      "total_price": 1999.98,
      "product": {
        "id": "uuid",
        "name": "iPhone 15 Pro",
        "images": ["https://example.com/image.jpg"],
        "in_stock": true
      }
    }
  ],
  "total_items": 2,
  "subtotal": 1999.98,
  "item_count": 1
}
```

### Update Cart Item Quantity
```http
PUT /api/v1/cart/items/{item_id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

### Clear Cart
```http
DELETE /api/v1/cart/clear
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Cart cleared successfully"
}
```

## 📦 Orders

### Create Order from Cart
```http
POST /api/v1/orders/
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "billing_address": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "US"
  },
  "shipping_address": {
    "name": "John Doe",
    "street": "456 Work St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10002",
    "country": "US"
  },
  "payment_method": "cash_on_delivery",
  "recommendation_source": "homepage",
  "recommendation_session_id": "rec_session_123",
  "order_notes": "Please handle with care"
}
```

**Note:**
- If `billing_address` is not provided, the system uses the user's profile address
- `payment_method` defaults to `"cash_on_delivery"` if not specified
- Free shipping for COD orders over $50

**Available Payment Methods:**
- `cash_on_delivery` (default)
- `credit_card`
- `debit_card`
- `paypal`
- `bank_transfer`
- `apple_pay`
- `google_pay`
- `upi`
- `wallet`

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-20250127-ABC123",
  "subtotal": 1999.98,
  "tax_amount": 159.99,
  "shipping_amount": 0.00,
  "total_amount": 2159.97,
  "status": "pending",
  "payment_status": "paid",
  "payment_method": "cash_on_delivery",
  "created_at": "2025-01-27T10:30:00Z",
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "iPhone 15 Pro",
      "quantity": 2,
      "unit_price": 999.99,
      "total_price": 1999.98
    }
  ]
}
```

### Get User Orders
```http
GET /api/v1/orders/?status=delivered&page=1&page_size=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (string): Filter by order status
- `page` (integer): Page number
- `page_size` (integer): Orders per page

**Response:**
```json
[
  {
    "id": "uuid",
    "order_number": "ORD-20250127-ABC123",
    "total_amount": 2159.97,
    "status": "delivered",
    "payment_method": "cash_on_delivery",
    "created_at": "2025-01-27T10:30:00Z",
    "items": [
      {
        "product_name": "iPhone 15 Pro",
        "quantity": 2,
        "unit_price": 999.99
      }
    ]
  }
]
```

### Get Order Details
```http
GET /api/v1/orders/{order_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-20250127-ABC123",
  "subtotal": 1999.98,
  "tax_amount": 159.99,
  "shipping_amount": 0.00,
  "total_amount": 2159.97,
  "status": "delivered",
  "payment_status": "paid",
  "payment_method": "cash_on_delivery",
  "billing_address": { /* address object */ },
  "shipping_address": { /* address object */ },
  "created_at": "2025-01-27T10:30:00Z",
  "items": [ /* order items */ ]
}
```

## 🎯 AI-Powered Recommendations

### Get User Recommendations
```http
GET /api/v1/recommendations/user?recommendation_type=homepage&limit=10
Authorization: Bearer {token} (optional)
```

**Query Parameters:**
- `recommendation_type` (string): Type of recommendations (homepage|product_page|cart|checkout)
- `limit` (integer): Number of recommendations (1-50)

**Response:**
```json
[
  {
    "product_id": "uuid",
    "product": {
      "id": "uuid",
      "name": "MacBook Pro",
      "price": 1999.99,
      "images": ["https://example.com/macbook.jpg"]
    },
    "score": 0.89,
    "reason": "users_also_bought",
    "algorithm": "collaborative_filtering",
    "explanation": "Popular with customers who share your tastes"
  }
]
```

### Get Product Recommendations
```http
GET /api/v1/recommendations/product/{product_id}?limit=10
Authorization: Bearer {token} (optional)
```

**Response:**
```json
[
  {
    "product_id": "uuid",
    "product": { /* product object */ },
    "score": 0.92,
    "reason": "similar_product",
    "algorithm": "vector_similarity",
    "explanation": "Similar to products you've viewed in Electronics"
  }
]
```

### Get Frequently Bought Together
```http
GET /api/v1/recommendations/fbt/{product_id}?limit=5
```

**Response:**
```json
{
  "product_id": "uuid",
  "recommendations": [
    {
      "product_id": "uuid",
      "product_name": "iPhone Case",
      "price": 29.99,
      "confidence": 0.85,
      "lift": 2.3,
      "in_stock": true,
      "product": { /* full product object */ },
      "explanation": "Frequently bought with iPhone 15 Pro"
    }
  ]
}
```

### Get Popular Products
```http
GET /api/v1/recommendations/popular?limit=10
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "iPhone 15 Pro",
    "price": 999.99,
    "popularity_score": 0.95,
    "order_count": 1250
  }
]
```

### Get Trending Products with Explanations
```http
GET /api/v1/recommendations/trending?limit=10
Authorization: Bearer {token} (optional)
```

**Response:**
```json
{
  "recommendations": [
    {
      "product_id": "uuid",
      "product": { /* product object */ },
      "score": 0.88,
      "algorithm": "trending",
      "explanation": "Currently trending in Electronics"
    }
  ],
  "recommendation_type": "trending"
}
```

### Get New Arrivals with Explanations
```http
GET /api/v1/recommendations/new-arrivals?limit=10
Authorization: Bearer {token} (optional)
```

**Response:**
```json
{
  "recommendations": [
    {
      "product_id": "uuid",
      "product": { /* product object */ },
      "score": 0.75,
      "algorithm": "new_arrivals",
      "explanation": "New arrival in Electronics"
    }
  ],
  "recommendation_type": "new_arrivals"
}
```

### Get Personalized Recommendations with Explanations
```http
GET /api/v1/recommendations/recommendations/{user_id}?limit=10
Authorization: Bearer {token} (optional)
```

**Response:**
```json
{
  "user_id": "uuid",
  "recommendations": [
    {
      "product_id": "uuid",
      "product": { /* product object */ },
      "score": 0.89,
      "algorithm": "collaborative_filtering",
      "explanation": "Popular with customers who share your tastes"
    }
  ],
  "recommendation_type": "personalized"
}
```

## 📊 Analytics (User Level)

### Get User Behavior Analysis
```http
GET /api/v1/analytics/user/{user_id}/behavior?days=30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "user_id": "uuid",
  "period_days": 30,
  "orders": {
    "count": 3,
    "total_spent": 2159.97,
    "average_order_value": 719.99,
    "last_order_date": "2025-01-20T10:30:00Z"
  },
  "searches": {
    "count": 15,
    "unique_queries": 8,
    "searches_with_clicks": 12
  },
  "category_preferences": {
    "Electronics": {
      "purchase_count": 2,
      "total_spend": 1999.98
    }
  }
}
```

---

# 🔧 SECTION 2: ADMIN CONSOLE & MANAGEMENT APIs

These APIs are designed for administrative dashboards and management systems.

## 👥 User Management

### Get All Users
```http
GET /api/v1/admin/users/?page=1&page_size=20&search=john
Authorization: Bearer {admin_token}
```

**Required Permission:** `users.view`

**Query Parameters:**
- `page` (integer): Page number
- `page_size` (integer): Users per page (1-100)
- `search` (string): Search by name, email, or username

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "country": "US"
    },
    "is_active": true,
    "created_at": "2025-01-27T10:30:00Z",
    "login_count": 25,
    "last_login": "2025-01-26T15:30:00Z"
  }
]
```

### Create User (Admin)
```http
POST /api/v1/admin/users/
Authorization: Bearer {admin_token}
```

**Required Permission:** `users.create`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Smith",
  "username": "jane_smith",
  "phone": "+1234567890",
  "address": {
    "street": "456 Oak Avenue",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90210",
    "country": "US",
    "address_type": "home"
  },
  "is_active": true
}
```

### Update User
```http
PUT /api/v1/admin/users/{user_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `users.update`

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Johnson",
  "username": "jane_johnson",
  "phone": "+1987654321",
  "is_active": false
}
```

### Assign Role to User
```http
POST /api/v1/admin/users/{user_id}/roles/{role_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `assign_roles`

### Remove Role from User
```http
DELETE /api/v1/admin/users/{user_id}/roles/{role_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `assign_roles`

## 🛍️ Product Management

### Create Product (Admin)
```http
POST /api/v1/admin/products/
Authorization: Bearer {admin_token}
```

**Required Permission:** `products.create`

**Request Body:**
```json
{
  "name": "New Product",
  "code": "NP-001",
  "price": 299.99,
  "category_id": "uuid",
  "brand": "TechBrand",
  "description": "Amazing new product...",
  "specification": {
    "color": "Black",
    "material": "Aluminum"
  },
  "images": ["https://example.com/image.jpg"],
  "stock_quantity": 100,
  "in_stock": true,
  "tags": ["electronics", "new"]
}
```

### Update Product
```http
PUT /api/v1/admin/products/{product_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `products.update`

**Request Body:**
```json
{
  "price": 279.99,
  "stock_quantity": 150,
  "description": "Updated description..."
}
```

## 📦 Order Management

### Get All Orders (Admin)
```http
GET /api/v1/admin/orders/?status=pending&page=1&page_size=20
Authorization: Bearer {admin_token}
```

**Required Permission:** `orders.view_all`

**Query Parameters:**
- `status` (string): Filter by order status
- `page` (integer): Page number
- `page_size` (integer): Orders per page

**Response:**
```json
[
  {
    "id": "uuid",
    "order_number": "ORD-20250127-ABC123",
    "user_id": "uuid",
    "total_amount": 2159.97,
    "status": "pending",
    "payment_method": "cash_on_delivery",
    "payment_status": "paid",
    "created_at": "2025-01-27T10:30:00Z",
    "customer_email": "user@example.com",
    "customer_username": "john_doe",
    "items_count": 2
  }
]
```

### Update Order Status
```http
PUT /api/v1/admin/orders/{order_id}/status
Authorization: Bearer {admin_token}
```

**Required Permission:** `orders.update`

**Request Body:**
```json
{
  "status": "shipped",
  "admin_notes": "Shipped via FedEx, tracking: 123456789"
}
```

### Get Order Details (Admin)
```http
GET /api/v1/admin/orders/{order_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `orders.view_all`

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-20250127-ABC123",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "country": "US"
    }
  },
  "total_amount": 2159.97,
  "status": "pending",
  "payment_status": "paid",
  "payment_method": "cash_on_delivery",
  "billing_address": { /* address */ },
  "shipping_address": { /* address */ },
  "items": [ /* order items with product details */ ],
  "recommendation_source": "homepage",
  "admin_notes": "Handle with care",
  "created_at": "2025-01-27T10:30:00Z"
}
```

## 📊 Analytics Dashboard

### Get Dashboard Overview (Quick Stats)
```http
GET /api/v1/admin/analytics/dashboard/overview
Authorization: Bearer {admin_token}
```

**Required Permission:** `admin_dashboard`

**Response:**
```json
{
  "total_products": 1500,
  "active_products": 1350,
  "total_users": 2000,
  "new_users_today": 12,
  "total_orders": 8500,
  "pending_orders": 45,
  "recent_searches": 567
}
```

### Get Admin Dashboard Metrics (Comprehensive)
```http
GET /api/v1/admin/analytics/dashboard?days=30
Authorization: Bearer {admin_token}
```

**Required Permission:** `analytics.view`

**Query Parameters:**
- `days` (integer): Number of days for metrics (1-365)

**Response:**
```json
{
  "period": {
    "start_date": "2024-12-28T00:00:00Z",
    "end_date": "2025-01-27T23:59:59Z"
  },
  "orders": {
    "total_orders": 1250,
    "total_revenue": 892500.50,
    "average_order_value": 714.00,
    "status_breakdown": {
      "pending": 45,
      "delivered": 1100,
      "cancelled": 25
    },
    "payment_method_breakdown": {
      "cash_on_delivery": 850,
      "credit_card": 200,
      "paypal": 150,
      "bank_transfer": 50
    },
    "recommendation_source_breakdown": {
      "collaborative": 350,
      "content_based": 200,
      "direct": 700
    },
    "daily_trend": [
      {
        "date": "2025-01-27",
        "orders": 42,
        "revenue": 29800.50
      }
    ]
  },
  "users": {
    "new_users": 125,
    "active_users": 850,
    "retention_rate": 68.5,
    "users_with_addresses": 780,
    "users_with_viewed_products": 650
  },
  "products": {
    "top_products": [
      {
        "name": "iPhone 15 Pro",
        "code": "IP15P-128",
        "quantity_sold": 89,
        "revenue": 88901.11
      }
    ],
    "category_performance": [
      {
        "category_id": "uuid",
        "orders": 456,
        "revenue": 456789.12
      }
    ]
  },
  "search": {
    "total_searches": 5670,
    "click_through_rate": 34.5,
    "average_response_time_ms": 145,
    "zero_result_rate": 8.2,
    "unique_queries": 1240
  },
  "recommendations": {
    "total_recommendations": 12500,
    "overall_click_rate": 18.5,
    "overall_conversion_rate": 6.2,
    "algorithm_performance": [
      {
        "algorithm": "collaborative",
        "total_recommendations": 5000,
        "click_rate": 22.1,
        "conversion_rate": 8.5,
        "average_score": 0.78
      }
    ]
  }
}
```

### Get Key Performance Indicators (KPIs)
```http
GET /api/v1/admin/analytics/kpis?days=30
Authorization: Bearer {admin_token}
```

**Required Permission:** `analytics.view`

**Response:**
```json
{
  "conversion_rate": 3.2,
  "average_order_value": 714.00,
  "revenue_per_user": 89.50,
  "cod_adoption_rate": 68.0,
  "recommendation_click_rate": 18.5,
  "recommendation_conversion_rate": 6.2,
  "collaborative_algorithm_performance": 22.1,
  "content_algorithm_performance": 15.8,
  "hybrid_algorithm_performance": 20.3,
  "search_success_rate": 91.8,
  "search_click_through_rate": 34.5,
  "average_search_response_time": 145,
  "zero_result_rate": 8.2,
  "user_retention_rate": 68.5,
  "new_user_percentage": 12.5,
  "user_activation_rate": 85.0
}
```

### Get Recommendation Performance
```http
GET /api/v1/admin/analytics/recommendations/performance?algorithm=collaborative&days=30
Authorization: Bearer {admin_token}
```

**Required Permission:** `analytics.view_detailed`

**Query Parameters:**
- `algorithm` (string): Filter by algorithm (collaborative|content_based|hybrid|trending|fbt)
- `days` (integer): Time period (1-365)

**Response:**
```json
{
  "algorithm": "collaborative",
  "period_days": 30,
  "total_recommendations": 5000,
  "total_clicks": 1105,
  "total_conversions": 425,
  "click_rate": 22.1,
  "conversion_rate": 8.5,
  "average_score": 0.78,
  "performance_by_day": [
    {
      "date": "2025-01-27",
      "recommendations": 180,
      "clicks": 42,
      "conversions": 18
    }
  ],
  "top_performing_products": [
    {
      "product_id": "uuid",
      "product_name": "iPhone 15 Pro",
      "recommendations": 145,
      "clicks": 35,
      "conversions": 18,
      "click_rate": 24.1
    }
  ]
}
```

### Get Segment Performance
```http
GET /api/v1/admin/analytics/segments/performance
Authorization: Bearer {admin_token}
```

**Required Permission:** `analytics.view_detailed`

**Response:**
```json
{
  "segments": [
    {
      "segment_name": "Champions",
      "member_count": 150,
      "orders_count": 450,
      "avg_order_value": 1250.00,
      "total_revenue": 562500.00,
      "revenue_per_member": 3750.00
    },
    {
      "segment_name": "At-Risk Customers",
      "member_count": 200,
      "orders_count": 80,
      "avg_order_value": 450.00,
      "total_revenue": 36000.00,
      "revenue_per_member": 180.00
    }
  ]
}
```

## 🤖 ML Model Management

**Base Path:** `/api/v1/admin/ml-models`

### Get ML Model Configurations
```http
GET /api/v1/admin/ml-models/ml-config/
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Collaborative_Filtering_v1",
    "model_type": "collaborative",
    "description": "User-based collaborative filtering with matrix factorization",
    "is_active": true,
    "accuracy_score": 0.8524,
    "precision_score": 0.7892,
    "recall_score": 0.8156,
    "last_trained": "2025-01-25T14:30:00Z",
    "parameters": {
      "n_factors": 50,
      "n_epochs": 20,
      "lr_all": 0.005,
      "reg_all": 0.02
    }
  }
]
```

### Create ML Model Configuration
```http
POST /api/v1/admin/ml-models/ml-config/
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Request Body:**
```json
{
  "name": "New_Collaborative_Model",
  "model_type": "collaborative",
  "description": "Enhanced collaborative filtering model",
  "parameters": {
    "n_factors": 100,
    "n_epochs": 25,
    "lr_all": 0.003,
    "reg_all": 0.015,
    "random_state": 42
  }
}
```

### Update ML Model Configuration
```http
PUT /api/v1/admin/ml-models/ml-config/{config_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Request Body:**
```json
{
  "parameters": {
    "n_epochs": 30,
    "lr_all": 0.004
  },
  "description": "Updated with better parameters"
}
```

### Activate ML Model Configuration
```http
POST /api/v1/admin/ml-models/ml-config/{config_id}/activate
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Response:**
```json
{
  "message": "Configuration activated successfully"
}
```

### Get Model Performance Metrics
```http
GET /api/v1/admin/ml-models/ml-config/{config_id}/performance
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Response:**
```json
{
  "config_id": "uuid",
  "model_type": "collaborative",
  "accuracy_score": 0.8524,
  "average_accuracy": 0.8401,
  "training_count": 5,
  "last_trained": "2025-01-25T14:30:00Z",
  "recommendation_performance": {
    "total_recommendations": 12500,
    "click_rate": 22.1,
    "conversion_rate": 8.5,
    "average_score": 0.78
  },
  "training_history": [
    {
      "started_at": "2025-01-25T14:30:00Z",
      "completed_at": "2025-01-25T15:45:00Z",
      "accuracy_score": 0.8524,
      "status": "completed"
    }
  ]
}
```

### Train ML Models
```http
POST /api/v1/admin/ml-models/ml-config/train
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Request Body:**
```json
{
  "retrain_all": true,
  "specific_models": ["als", "content", "kmeans", "lightgbm", "fbt"]
}
```

**Response:**
```json
{
  "training_id": "train_20250127_143000",
  "status": "started",
  "models_training": ["als", "content", "kmeans", "lightgbm", "fbt"],
  "estimated_completion": "2025-01-27T15:00:00Z"
}
```

## 👥 User Segmentation Management

### Get All User Segments
```http
GET /api/v1/admin/user-segmentation/segments
Authorization: Bearer {admin_token}
```

**Required Permission:** `view_user_segmentation`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "High Value Customers",
    "description": "Customers with high lifetime value",
    "segment_type": "rfm",
    "criteria": {
      "monetary_amount": {"min": 500, "max": null},
      "frequency_orders": {"min": 3, "max": null},
      "recency_days": {"min": 0, "max": 90}
    },
    "member_count": 150,
    "is_active": true,
    "auto_update": true,
    "last_updated": "2025-01-26T10:00:00Z"
  }
]
```

### Create User Segment
```http
POST /api/v1/admin/user-segmentation/segments
Authorization: Bearer {admin_token}
```

**Required Permission:** `manage_user_segmentation`

**Request Body:**
```json
{
  "name": "Mobile Users",
  "description": "Users who primarily shop via mobile",
  "segment_type": "behavioral",
  "criteria": {
    "event_types": ["product_view", "add_to_cart"],
    "device_type": "mobile",
    "min_events": 5,
    "days_back": 30
  },
  "auto_update": true
}
```

### Update User Segment
```http
PUT /api/v1/admin/user-segmentation/segments/{segment_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `manage_user_segmentation`

**Request Body:**
```json
{
  "description": "Updated description",
  "criteria": {
    "min_events": 10
  }
}
```

### Get Segment Analytics
```http
GET /api/v1/admin/user-segmentation/segments/analytics?segment_id={id}&days=30
Authorization: Bearer {admin_token}
```

**Required Permission:** `view_user_segmentation`

**Query Parameters:**
- `segment_id` (string): Optional - specific segment ID
- `days` (integer): Time period for analytics (1-365)

**Response:**
```json
[
  {
    "segment_id": "uuid",
    "segment_name": "High Value Customers",
    "member_count": 150,
    "conversion_rate": 12.5,
    "avg_order_value": 1250.00
  }
]
```

### Recalculate Segment Membership
```http
POST /api/v1/admin/user-segmentation/segments/{segment_id}/recalculate
Authorization: Bearer {admin_token}
```

**Required Permission:** `manage_user_segmentation`

**Response:**
```json
{
  "message": "Segment recalculated successfully",
  "member_count": 245
}
```

### Get Segment Users
```http
GET /api/v1/admin/user-segmentation/segments/{segment_id}/users?limit=100&offset=0
Authorization: Bearer {admin_token}
```

**Required Permission:** `view_user_segmentation`

**Response:**
```json
{
  "segment_id": "uuid",
  "segment_name": "High Value Customers",
  "total_users": 245,
  "users": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "joined_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### Add User to Segment
```http
POST /api/v1/admin/user-segmentation/segments/{segment_id}/users/{user_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `manage_user_segmentation`

### Remove User from Segment
```http
DELETE /api/v1/admin/user-segmentation/segments/{segment_id}/users/{user_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `manage_user_segmentation`

### Generate RFM Segments (ML-based)
```http
POST /api/v1/admin/user-segmentation/segments/generate-rfm
Authorization: Bearer {admin_token}
```

**Required Permission:** `manage_user_segmentation`

**Request Body:**
```json
{
  "n_clusters": 5,
  "lookback_days": 365
}
```

**Response:**
```json
{
  "message": "RFM segments generated successfully",
  "segments_created": 5,
  "total_users_segmented": 1850
}
```

## 🎨 Personalized Promotion Management (Google Gemini AI)

### Generate Promotional Content
```http
POST /api/v1/recommendations/generate-promotion
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Request Body:**
```json
{
  "cluster_id": 0,
  "target_product_category": "Electronics",
  "product_id": "uuid",
  "additional_context": "Black Friday Sale"
}
```

**Response:**
```json
{
  "ad_content": "Exclusive VIP access to our premium Electronics collection! As one of our most valued customers, enjoy early access to the latest iPhone with special member pricing."
}
```

### Generate AI Banner (Google Imagen)
```http
POST /api/v1/recommendations/generate-banner
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Request Body:**
```json
{
  "prompt": "Create a modern e-commerce banner for iPhone 15 Pro with premium styling and holiday theme",
  "user_id": "uuid",
  "aspect_ratio": "16:9",
  "product_id": "uuid"
}
```

**Response:**
```json
{
  "banner_id": "banner_20250127_143052_abc123",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "saved_path": "generated_banners/banner_20250127_143052.jpg",
  "prompt": "Create a modern e-commerce banner...",
  "product_id": "uuid"
}
```

### Get Banner Details
```http
GET /api/v1/recommendations/banner/{banner_id}
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Response:**
```json
{
  "id": "banner_20250127_143052_abc123",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "saved_path": "generated_banners/banner_20250127_143052.jpg",
  "prompt": "Create a modern e-commerce banner...",
  "product_id": "uuid",
  "product_category": "Electronics",
  "target_audience": {
    "cluster_ids": [0, 1],
    "min_spend": 500,
    "max_recency_days": 30
  },
  "created_at": "2025-01-27T14:30:52Z",
  "created_by": "admin_uuid",
  "is_published": true,
  "start_date": "2025-01-27T00:00:00Z",
  "end_date": "2025-02-27T23:59:59Z",
  "priority": 8
}
```

### Publish Banner with Targeting
```http
POST /api/v1/recommendations/publish-banner
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Request Body:**
```json
{
  "banner_id": "banner_20250127_143052_abc123",
  "target_audience": {
    "cluster_ids": [0, 1, 2],
    "region": "US",
    "min_spend": 500,
    "max_recency_days": 30
  },
  "start_date": "2025-01-27T00:00:00Z",
  "end_date": "2025-02-27T23:59:59Z",
  "priority": 8
}
```

**Response:**
```json
{
  "message": "Banner published successfully",
  "banner_id": "banner_20250127_143052_abc123"
}
```

### Generate Complete Personalized Campaign
```http
POST /api/v1/recommendations/personalized-promotion
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.ml_models`

**Request Body (Form Data):**
```
user_id: uuid
target_product_category: Electronics
product_id: uuid
additional_context: New Year Sale
```

**Response:**
```json
{
  "user_id": "uuid",
  "segment": {
    "id": 0,
    "name": "Champions",
    "description": "Recent, frequent buyers with high spending"
  },
  "promotional_text": "Exclusive VIP access to our premium Electronics collection! As one of our most valued customers, enjoy early access to the latest iPhone with special member pricing.",
  "banner": {
    "id": "banner_20250127_143052_def456",
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "saved_path": "generated_banners/banner_20250127_143052.jpg"
  },
  "target_product_category": "Electronics",
  "product_id": "uuid",
  "additional_context": "New Year Sale"
}
```

### Get User Targeted Banners (Live Banners)
```http
GET /api/v1/recommendations/user-banners/{user_id}?limit=3
Authorization: Bearer {token}
```

**Required Permission:** `analytics.view`

**Note:** This endpoint shows which banners are currently being displayed to a specific user based on their segment and targeting criteria.

**Response:**
```json
{
  "user_id": "uuid",
  "banners": [
    {
      "id": "banner_123",
      "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "product_id": "uuid",
      "product_category": "Electronics",
      "priority": 10
    }
  ]
}
```

## ⚙️ System Management

### Get System Status
```http
GET /api/v1/admin/system/status
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.admin`

**Response:**
```json
{
  "system_health": {
    "database": "healthy",
    "ml_models_active": 3,
    "embeddings_service": "configured",
    "user_data_stats": {
      "total_users": 2000,
      "users_with_usernames": 2000,
      "users_with_addresses": 1850,
      "users_with_viewed_products": 1600
    }
  },
  "recent_activity": {
    "orders_24h": 89,
    "new_users_24h": 12,
    "cod_orders_24h": 65
  },
  "timestamp": "2025-01-27T14:30:00Z"
}
```

### Get System Configuration
```http
GET /api/v1/admin/system/config
Authorization: Bearer {admin_token}
```

**Required Permission:** `system.settings`

**Response:**
```json
{
  "app_name": "E-commerce Backend",
  "version": "2.0.0",
  "embedding_model": "amazon.titan-embed-text-v1",
  "recommendation_models_enabled": [
    "collaborative",
    "content_based",
    "ml_models"
  ],
  "analytics_retention_days": 365,
  "admin_panel_enabled": true,
  "default_payment_method": "cash_on_delivery",
  "free_shipping_threshold": 50.00
}
```

---

# 🔐 Authentication & Authorization

## JWT Token Format
All authenticated requests require a Bearer token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Token Expiration
- **Access Token:** 30 minutes (1800 seconds)
- **Refresh Token:** Not implemented (use re-authentication)

## User Roles & Permissions

### Customer Role
- `products.view`
- `cart.view`
- `cart.manage`
- `orders.view`
- `analytics.view` (own data only)

### Manager Role
- `products.view`
- `products.update`
- `products.manage_inventory`
- `orders.view`
- `orders.view_all`
- `orders.update`
- `analytics.view`
- `users.view`

### Admin Role
- `users.*` (all user permissions)
- `products.*` (all product permissions)
- `orders.*` (all order permissions)
- `analytics.*` (all analytics permissions)
- `system.*` (all system permissions)
- `assign_roles`
- `view_user_segmentation`
- `manage_user_segmentation`

## Default Admin Account
- **Email:** `admin@ecommerce.com`
- **Password:** `admin123`
- **Permissions:** Full system access

---

# 📊 Response Formats & Status Codes

## HTTP Status Codes

### Success Responses
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content returned

### Client Error Responses
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error

### Server Error Responses
- `500 Internal Server Error` - Server error

## Error Response Format
```json
{
  "detail": "Error message description",
  "error_code": "VALIDATION_ERROR",
  "field_errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Pagination Format
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

---

# 🚀 Getting Started

## 1. Setup & Installation
```bash
# Clone repository
git clone <repository-url>
cd recommendationsystem/services/backend

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database and API credentials

# Run database migrations
psql -d your_database -f migration_and_database/db_migration_script.sql

# Run Python migration for user data
python migration_and_database/python_migration_script.py

# Import sample data
python migration_and_database/run_migration.py

# Start the server
python run.py
```

## 2. Access Interactive Documentation
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

## 3. Test Authentication
```bash
# Login with email
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@ecommerce.com&password=admin123"

# Use the returned token for authenticated requests
curl -X GET "http://localhost:8000/api/v1/admin/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 4. Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS Bedrock (for embeddings and LLM)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v1
BEDROCK_LLM_MODEL=anthropic.claude-v2

# Google AI (for image generation and promotional content)
GOOGLE_API_KEY=your-google-api-key

# Application
PROJECT_NAME=E-commerce Backend
VERSION=2.0.0
DEBUG=true
HOST=127.0.0.1
PORT=8000

# ML Model Storage
MODEL_STORAGE_PATH=ml_models
```

---

# 🔧 Advanced Features

## ML-Powered Recommendations
Multiple recommendation algorithms with explainable AI:
- **Collaborative Filtering:** User-based matrix factorization (ALS)
- **Content-Based:** Product feature similarity with embeddings
- **Hybrid:** Combines multiple approaches with weighted scoring
- **Frequent Pattern Mining:** Association rules for "bought together"
- **Explainability:** Natural language explanations via AWS Bedrock Claude

## Customer Segmentation
RFM (Recency, Frequency, Monetary) analysis with ML clustering:
- Automatic clustering using K-means
- 8+ predefined segments (Champions, At-Risk, etc.)
- Real-time segment assignment
- Auto-updating segments based on behavior

## AI-Generated Promotions
Google Gemini AI & Imagen integration:
- Text generation based on customer segments (via AWS Bedrock Claude)
- Visual banner creation (Google Imagen API)
- Audience targeting and scheduling
- Personalized campaign generation

## Real-time Analytics
Comprehensive tracking system:
- User behavior tracking with viewed products
- Search performance metrics
- Recommendation effectiveness
- Business KPIs and trends
- Payment method analytics
- Funnel analysis
- Cohort retention tracking

## Vector Search & Embeddings
Amazon Titan embeddings for semantic product search:
- Products automatically generate embeddings on creation
- Search combines text matching with vector similarity
- Similar products found using cosine similarity
- pgvector extension for efficient similarity queries

## Explainable AI
Natural language explanations for recommendations:
- AWS Bedrock Claude integration
- Context-aware explanations
- Algorithm-specific reasoning
- Batch explanation generation for performance

---

# 📖 API Endpoint Summary

## Total Endpoints: 60+

### User APIs (Public): 25+
- Authentication: 3
- User Profile: 5
- Products: 5
- Search: 3
- Cart: 4
- Orders: 3
- Recommendations: 7+

### Admin APIs (Protected): 35+
- User Management: 4
- Product Management: 2
- Order Management: 3
- Analytics: 5
- ML Models: 6
- User Segmentation: 8
- Promotions (AI): 6
- System: 2

---

**Documentation Version:** 2.0.0
**Last Updated:** 2025-01-13
**Status:** ✅ Production Ready

For issues or questions, please refer to:
- GitHub Issues: [repository-url]/issues
- API Audit Report: `API_AUDIT_REPORT.md`
- Unused Code Audit: `UNUSED_AND_REDUNDANT_CODE_AUDIT.md`
