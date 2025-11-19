# 🛍️ Products API

Product catalog management including listing, search, categories, and product details.

**Base Path:** `/api/v1/products`

---

## Endpoints

### 1. List Products

Get a paginated list of products with advanced filtering.

**Endpoint:** `GET /products`

**Authentication:** Optional (Better personalization if authenticated)

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number | 1 |
| `size` | integer | Items per page (max 100) | 20 |
| `category` | string | Filter by category name | - |
| `brand` | string | Filter by brand name | - |
| `min_price` | float | Minimum price | - |
| `max_price` | float | Maximum price | - |
| `in_stock` | boolean | Show only in-stock items | - |
| `sort_by` | string | `name`, `price`, `created_at`, `popularity` | `created_at` |
| `sort_order` | string | `asc` or `desc` | `desc` |
| `search_term` | string | Search in name/description | - |

**Example Request:**
```
GET /products?category=Electronics&min_price=100&max_price=1000&sort_by=price&sort_order=asc&page=1&size=20
```

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Wireless Headphones Pro",
      "description": "Premium noise-cancelling headphones",
      "price": 299.99,
      "original_price": 399.99,
      "discount_percentage": 25.0,
      "brand": "AudioTech",
      "category": {
        "id": "cat-123",
        "name": "Electronics",
        "slug": "electronics"
      },
      "images": [
        "https://example.com/images/headphones-1.jpg",
        "https://example.com/images/headphones-2.jpg"
      ],
      "stock_quantity": 45,
      "in_stock": true,
      "rating": 4.5,
      "review_count": 128,
      "is_featured": true,
      "tags": ["wireless", "bluetooth", "noise-cancelling"],
      "created_at": "2025-11-01T10:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

---

### 2. Get Product Categories

List all product categories with hierarchy.

**Endpoint:** `GET /products/categories`

**Authentication:** None required

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `top_level_only` | boolean | Return only root categories | `true` |

**Response:** `200 OK`
```json
[
  {
    "id": "cat-001",
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "slug": "electronics",
    "sort_order": 1,
    "children": [
      {
        "id": "cat-001-01",
        "name": "Smartphones",
        "slug": "smartphones",
        "sort_order": 1
      },
      {
        "id": "cat-001-02",
        "name": "Laptops",
        "slug": "laptops",
        "sort_order": 2
      }
    ]
  },
  {
    "id": "cat-002",
    "name": "Fashion",
    "description": "Clothing and accessories",
    "slug": "fashion",
    "sort_order": 2,
    "children": []
  }
]
```

---

### 3. Get Trending Products

Get currently trending products based on recent activity.

**Endpoint:** `GET /products/trending`

**Authentication:** None required

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of products (1-100) | 10 |

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "prod-123",
      "name": "Smart Watch Series 5",
      "price": 399.99,
      "images": ["https://..."],
      "rating": 4.7,
      "trending_score": 95.5,
      "view_count_24h": 1250,
      "purchase_count_24h": 45
    }
  ]
}
```

---

### 4. Advanced Product Search

Comprehensive search with vector similarity and filters.

**Endpoint:** `GET /products/search`

**Authentication:** Optional (Better personalization if authenticated)

**Query Parameters:**
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `q` | string | Search query | ✅ Yes |
| `category` | string | Filter by category | No |
| `brand` | string | Filter by brand | No |
| `min_price` | float | Minimum price | No |
| `max_price` | float | Maximum price | No |
| `in_stock` | boolean | Only in-stock | No |
| `sort_by` | string | Sort field | No |
| `sort_order` | string | `asc`/`desc` | No |
| `use_vector_search` | boolean | Use AI similarity | No |
| `session_id` | string | For analytics | No |
| `page` | integer | Page number | No |
| `size` | integer | Items per page | No |

**Example Request:**
```
GET /products/search?q=wireless headphones&category=Electronics&min_price=50&max_price=500&use_vector_search=true
```

**Response:** `200 OK`
```json
{
  "search_id": "search-abc-123",
  "query": "wireless headphones",
  "products": [
    {
      "id": "prod-456",
      "name": "Premium Wireless Headphones",
      "description": "...",
      "price": 299.99,
      "relevance_score": 0.95,
      "match_type": "vector_similarity"
    }
  ],
  "total": 45,
  "page": 1,
  "size": 20,
  "search_time_ms": 125,
  "filters_applied": {
    "category": "Electronics",
    "price_range": [50, 500]
  },
  "suggestions": ["wireless earbuds", "bluetooth headphones"]
}
```

---

### 5. Get Product Details

Get detailed information about a specific product.

**Endpoint:** `GET /products/{product_id}`

**Authentication:** Optional

**Path Parameters:**
- `product_id` (UUID): Product identifier

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Wireless Headphones Pro",
  "description": "Premium over-ear headphones with active noise cancellation...",
  "long_description": "Detailed product information...",
  "price": 299.99,
  "original_price": 399.99,
  "discount_percentage": 25.0,
  "brand": "AudioTech",
  "model": "WH-1000XM5",
  "sku": "AUDIO-WH-1000",
  "category": {
    "id": "cat-123",
    "name": "Electronics",
    "slug": "electronics",
    "breadcrumb": ["Home", "Electronics", "Audio"]
  },
  "images": [
    {
      "url": "https://example.com/images/main.jpg",
      "alt": "Main product image",
      "is_primary": true
    }
  ],
  "stock_quantity": 45,
  "in_stock": true,
  "low_stock_threshold": 10,
  "rating": 4.5,
  "review_count": 128,
  "specifications": {
    "weight": "250g",
    "battery_life": "30 hours",
    "connectivity": "Bluetooth 5.0",
    "color": "Black"
  },
  "features": [
    "Active Noise Cancellation",
    "30-hour battery life",
    "Premium comfort padding"
  ],
  "tags": ["wireless", "bluetooth", "noise-cancelling"],
  "warranty": "2 years manufacturer warranty",
  "shipping_info": {
    "weight": 0.5,
    "dimensions": "20x18x9 cm",
    "free_shipping": true,
    "estimated_delivery": "2-3 business days"
  },
  "is_featured": true,
  "is_new": false,
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-12T08:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Product doesn't exist
```json
{
  "detail": "Product not found"
}
```

---

### 6. Get Similar Products

Find products similar to a given product.

**Endpoint:** `GET /products/{product_id}/similar`

**Authentication:** Optional

**Path Parameters:**
- `product_id` (UUID): Reference product

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of results (1-50) | 10 |
| `use_vector_similarity` | boolean | Use AI similarity | `true` |

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "prod-789",
      "name": "Similar Wireless Headphones",
      "price": 249.99,
      "similarity_score": 0.89,
      "similarity_reason": "Same category, similar features"
    }
  ]
}
```

---

### 7. Get New Arrivals

Get recently added products.

**Endpoint:** `GET /products/new-arrivals`

**Authentication:** None required

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of products | 20 |
| `days` | integer | Consider items from last N days | 30 |
| `category` | string | Filter by category | - |

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "prod-new-001",
      "name": "Latest Smartphone Model",
      "price": 999.99,
      "images": ["..."],
      "is_new": true,
      "added_date": "2025-11-10T00:00:00Z"
    }
  ],
  "total": 25
}
```

---

### 8. Get Products by Category

List all products in a specific category.

**Endpoint:** `GET /products/categories/{category_id}/products`

**Authentication:** None required

**Path Parameters:**
- `category_id` (UUID): Category identifier

**Query Parameters:**
Same as List Products endpoint (pagination, sorting, filtering)

**Response:** `200 OK`
```json
{
  "category": {
    "id": "cat-123",
    "name": "Electronics",
    "description": "..."
  },
  "products": [...],
  "total": 234,
  "page": 1,
  "size": 20,
  "pages": 12
}
```

---

### 9. Upload Product Image

Upload an image for product (admin only).

**Endpoint:** `POST /products/upload-image`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Image file (JPG, PNG, WebP, max 5MB)
- `product_id` (optional): Associate with product

**Response:** `200 OK`
```json
{
  "file_id": "file-abc-123",
  "filename": "headphones-main.jpg",
  "url": "https://cdn.example.com/images/headphones-main.jpg",
  "size_bytes": 245678,
  "content_type": "image/jpeg",
  "uploaded_at": "2025-11-12T10:30:00Z"
}
```

---

### 10. Track Search Click

Log when a user clicks on a search result (analytics).

**Endpoint:** `POST /products/search/{search_id}/click`

**Authentication:** Optional

**Path Parameters:**
- `search_id` (string): Search session ID from search response

**Request Body:**
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "position": 3,
  "timestamp": "2025-11-12T10:30:00Z"
}
```

**Response:** `200 OK`
```json
{
  "message": "Click tracked successfully"
}
```

---

## 🎯 Use Cases

### Browse Products by Category
```javascript
// 1. Get categories
const categories = await fetch('/api/v1/products/categories');

// 2. Get products in category
const products = await fetch(
  '/api/v1/products?category=Electronics&page=1&size=20'
);
```

### Search with Filters
```javascript
const results = await fetch(
  '/api/v1/products/search?' +
  'q=wireless+headphones&' +
  'min_price=50&' +
  'max_price=500&' +
  'in_stock=true&' +
  'use_vector_search=true'
);
```

### Product Detail Page
```javascript
// Get product details
const product = await fetch('/api/v1/products/550e8400-...');

// Get similar products
const similar = await fetch('/api/v1/products/550e8400-.../similar?limit=6');
```

---

## 🔍 Search Features

### Traditional Search
- Full-text search in product names and descriptions
- Exact and fuzzy matching
- Filter by category, brand, price range, stock status

### Vector Search (AI-Powered)
- Semantic similarity search using embeddings
- Understands intent and context
- Finds products even with different wording
- Example: "noise cancelling earbuds" matches "ANC headphones"

### Hybrid Search
- Combines traditional keyword search with vector similarity
- Weighted scoring for best results
- Fallback to traditional search if vector search fails

---

## 📊 Product Sorting Options

| Sort Option | Description |
|-------------|-------------|
| `relevance` | Most relevant to search query (search only) |
| `popularity` | Based on views and purchases |
| `price` | By price (use with `sort_order`) |
| `name` | Alphabetical order |
| `created_at` | Newest or oldest first |
| `rating` | Highest or lowest rated |

---

## 🧪 Testing Examples

### cURL: Search Products
```bash
curl -X GET "http://localhost:8000/api/v1/products/search?q=headphones&min_price=100&max_price=500" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### cURL: Get Product Details
```bash
curl -X GET "http://localhost:8000/api/v1/products/550e8400-e29b-41d4-a716-446655440000"
```

### cURL: Get Categories
```bash
curl -X GET "http://localhost:8000/api/v1/products/categories"
```
