# 🤖 Recommendations API

Advanced AI-powered recommendation engines using multiple machine learning algorithms.

**Base Path:** `/api/v1/products`

---

## Overview

The recommendation system uses multiple algorithms to provide personalized product suggestions:

| Algorithm | Use Case | ML Model |
|-----------|----------|----------|
| **Collaborative Filtering** | User-to-user similarity | ALS (Alternating Least Squares) |
| **Content-Based** | Product similarity | Vector embeddings + Cosine similarity |
| **Hybrid** | Combined approach | Ensemble of CF + Content + Trending |
| **FBT** | Frequently Bought Together | Co-occurrence analysis |
| **Segment-Based** | Group preferences | K-Means clustering |
| **Reorder Predictions** | Buy again | LightGBM + Purchase history |
| **Personalized Trending** | Trending for you | Time-decay + User preferences |

---

## Endpoints

### 1. Get Personalized Recommendations

Get general personalized product recommendations for the user.

**Endpoint:** `GET /products/recommendations`

**Authentication:** Optional (Better recommendations if authenticated)

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-15) | 10 |
| `use_ml` | boolean | Use ML models | `true` |

**Response:** `200 OK`
```json
{
  "recommendations": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "product": {
        "id": "550e8400-...",
        "name": "Wireless Headphones Pro",
        "price": 299.99,
        "images": ["https://..."],
        "rating": 4.5
      },
      "score": 0.92,
      "algorithm": "ml_based",
      "reason": "Based on your browsing history and preferences",
      "confidence": "high"
    }
  ],
  "source": "ml_based",
  "ml_models_used": ["vector_similarity", "content_based"]
}
```

**For Anonymous Users:**
- Returns trending products
- `source`: "trending"

**For Authenticated Users:**
- Personalized based on behavior, purchases, and preferences
- `source`: "ml_based"

---

### 2. Collaborative Filtering Recommendations

User-user collaborative filtering based on purchase patterns.

**Endpoint:** `GET /products/recommendations/collaborative`

**Authentication:** Optional

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-50) | 10 |

**Algorithm:** ALS (Alternating Least Squares) Matrix Factorization

**How it works:**
- Analyzes purchase patterns across all users
- Finds users with similar buying behavior
- Recommends what similar users bought
- Uses matrix factorization for scalability

**Response:** `200 OK`
```json
[
  {
    "product_id": "prod-123",
    "product": {...},
    "score": 0.88,
    "cf_score": 0.88,
    "algorithm": "collaborative_filtering",
    "reason": "Users similar to you also purchased this",
    "similar_users_count": 45,
    "confidence": "high"
  }
]
```

**Use Cases:**
- "Customers who bought this also bought"
- Discovery of new products based on user similarity
- Works well with cold-start users (few purchases)

---

### 3. Content-Based Recommendations

Product similarity using embeddings and features.

**Endpoint:** `GET /products/recommendations/content-based`

**Authentication:** Optional

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-50) | 10 |
| `reference_product_id` | UUID | Base product for similarity | - |

**Algorithm:** Vector Embeddings + Cosine Similarity

**How it works:**
- Uses product descriptions, features, categories
- Generates vector embeddings using transformer models
- Calculates cosine similarity between product vectors
- Filters by user preferences and browsing history

**Response:** `200 OK`
```json
[
  {
    "product_id": "prod-456",
    "product": {...},
    "score": 0.94,
    "content_score": 0.94,
    "algorithm": "content_based",
    "reason": "Similar features and category to products you liked",
    "similarity_score": 0.94,
    "shared_features": ["wireless", "bluetooth", "noise-cancelling"]
  }
]
```

**Use Cases:**
- Find similar products
- Category-based discovery
- Feature-based recommendations

---

### 4. Hybrid Recommendations

Ensemble of collaborative, content-based, and trending algorithms.

**Endpoint:** `GET /products/recommendations/hybrid`

**Authentication:** Optional

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-50) | 10 |
| `cf_weight` | float | Collaborative filtering weight (0-1) | 0.4 |
| `content_weight` | float | Content-based weight (0-1) | 0.4 |
| `trending_weight` | float | Trending weight (0-1) | 0.2 |

**Algorithm:** Weighted Ensemble

**How it works:**
- Combines scores from multiple algorithms
- Weighted average based on algorithm performance
- Diversity optimization to avoid similar items
- Fallback mechanisms for cold-start scenarios

**Response:** `200 OK`
```json
[
  {
    "product_id": "prod-789",
    "product": {...},
    "score": 0.91,
    "cf_score": 0.85,
    "content_score": 0.92,
    "trending_score": 0.95,
    "algorithm": "hybrid",
    "reason": "Combined score from multiple algorithms (CF: 0.4, Content: 0.4, Trending: 0.2)",
    "confidence": "very_high",
    "explanation": {
      "primary_reason": "High content similarity",
      "secondary_reason": "Popular among similar users",
      "tertiary_reason": "Currently trending"
    }
  }
]
```

**Use Cases:**
- Main recommendation engine for homepage
- Best overall accuracy and coverage
- Balanced between personalization and discovery

---

### 5. Frequently Bought Together (FBT)

Products often purchased together with a given product.

**Endpoint:** `GET /products/fbt-recommendations/{product_id}`

**Authentication:** None required

**Path Parameters:**
- `product_id` (UUID): Reference product

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-20) | 4 |

**Algorithm:** Association Rule Mining (Apriori)

**How it works:**
- Analyzes co-occurrence in historical orders
- Calculates support, confidence, and lift metrics
- Filters by minimum thresholds
- Ranks by combined score

**Response:** `200 OK`
```json
[
  {
    "product_id": "acc-001",
    "product": {
      "id": "acc-001",
      "name": "Headphone Case",
      "price": 19.99,
      "images": ["https://..."]
    },
    "score": 0.87,
    "algorithm": "fbt",
    "reason": "Purchased together 87% of the time",
    "co_occurrence_count": 234,
    "confidence": 0.87,
    "lift": 3.2
  }
]
```

**Use Cases:**
- Product detail page "Frequently Bought Together"
- Cross-sell opportunities
- Bundle suggestions
- Cart page add-ons

---

### 6. Segment-Based Recommendations

Products popular within user's behavioral segment.

**Endpoint:** `GET /products/recommendations/segment-based`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-50) | 10 |

**Algorithm:** K-Means Clustering + Popularity

**How it works:**
- Users are clustered into behavioral segments
- Segments based on: purchase history, browsing, preferences
- Recommends popular products within user's segment
- Excludes products user already owns

**User Segments:**
- High-Value Customers
- Electronics Enthusiasts
- Bargain Hunters
- Young Adults
- At-Risk Customers

**Response:** `200 OK`
```json
[
  {
    "product_id": "prod-999",
    "product": {...},
    "score": 0.89,
    "algorithm": "segment_based",
    "reason": "Popular among users in your segment",
    "segment_id": "seg-high-value",
    "segment_name": "High-Value Customers",
    "popularity": 156,
    "segment_purchase_rate": 0.42
  }
]
```

**Use Cases:**
- Personalized homepage sections
- Email marketing campaigns
- Segment-specific promotions

---

### 7. Reorder Predictions (Buy Again)

Predict products user is likely to reorder.

**Endpoint:** `GET /products/recommendations/reorder-predictions`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-50) | 10 |

**Algorithm:** LightGBM + Purchase History Analysis

**How it works:**
- Analyzes user's purchase history
- Considers: frequency, recency, quantity, category
- Predicts reorder probability using gradient boosting
- Prioritizes consumables and repeat-purchase items

**Features Used:**
- Days since last purchase
- Total purchase count
- Average quantity
- Purchase interval consistency
- Product category (consumables score higher)
- User's reorder rate

**Response:** `200 OK`
```json
[
  {
    "product_id": "prod-consumable-123",
    "product": {
      "name": "Coffee Beans - Premium Blend",
      "price": 24.99
    },
    "score": 0.93,
    "algorithm": "reorder_prediction",
    "reason": "You've ordered this 5 times",
    "order_count": 5,
    "last_order_days_ago": 28,
    "avg_quantity": 2,
    "predicted_reorder_date": "2025-11-20",
    "replenishment_reminder": true
  }
]
```

**Use Cases:**
- "Buy Again" section in account
- Subscription suggestions
- Replenishment reminders
- Quick reorder for frequently bought items

---

### 8. Personalized Trending

Trending products filtered by user preferences.

**Endpoint:** `GET /products/recommendations/personalized-trending`

**Authentication:** Optional

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of recommendations (1-50) | 10 |
| `time_window_hours` | integer | Trending time window | 24 |

**Algorithm:** Time-Decay + User Preference Matching

**How it works:**
- Identifies currently trending products (views, purchases)
- Applies time-decay function (recent activity weighted more)
- Filters by user's preferred categories and price range
- Ranks by personalized trending score

**Response:** `200 OK`
```json
[
  {
    "product_id": "trend-001",
    "product": {...},
    "score": 0.96,
    "algorithm": "personalized_trending",
    "reason": "Trending in Electronics category you follow",
    "trending_score": 0.96,
    "view_count_24h": 2,340,
    "purchase_count_24h": 87,
    "velocity": "rising",
    "preference_match": ["Electronics", "Gadgets"]
  }
]
```

**Use Cases:**
- "Trending for You" homepage section
- Personalized discovery
- New product launches

---

### 9. Similar Products

Find products similar to a reference product.

**Endpoint:** `GET /products/{product_id}/similar`

**Authentication:** None required

**Path Parameters:**
- `product_id` (UUID): Reference product

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of results (1-50) | 10 |
| `use_vector_similarity` | boolean | Use embedding similarity | `true` |

**Algorithm:** Vector Embeddings + Feature Matching

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "similar-001",
      "name": "Similar Wireless Headphones",
      "price": 249.99,
      "similarity_score": 0.89,
      "similarity_reason": "Same category, similar features",
      "shared_features": ["wireless", "bluetooth", "over-ear"],
      "price_difference": -50.00
    }
  ]
}
```

---

### 10. New Arrivals

Get recently added products (personalized if authenticated).

**Endpoint:** `GET /products/new-arrivals`

**Authentication:** Optional

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of products | 20 |
| `days` | integer | Look back period (1-365) | 30 |
| `category` | string | Filter by category | - |

**Response:** `200 OK`
```json
{
  "products": [
    {
      "id": "new-001",
      "name": "Latest Smartphone Model",
      "price": 999.99,
      "is_new": true,
      "added_date": "2025-11-10T00:00:00Z",
      "days_since_added": 2
    }
  ],
  "total": 25
}
```

---

## 🎯 Recommendation Strategy

### Homepage
```javascript
// Mix of different algorithms
const trending = await fetch('/api/v1/products/recommendations/personalized-trending?limit=10');
const forYou = await fetch('/api/v1/products/recommendations/hybrid?limit=10');
const newArrivals = await fetch('/api/v1/products/new-arrivals?limit=10');
```

### Product Detail Page
```javascript
const productId = '550e8400-...';

// FBT for cross-sell
const fbt = await fetch(`/api/v1/products/fbt-recommendations/${productId}?limit=4`);

// Similar products
const similar = await fetch(`/api/v1/products/${productId}/similar?limit=6`);
```

### Account/Profile Page
```javascript
// Buy again section
const buyAgain = await fetch('/api/v1/products/recommendations/reorder-predictions?limit=10');

// Personalized recommendations
const forYou = await fetch('/api/v1/products/recommendations?limit=20');
```

---

## 📊 Algorithm Performance

| Algorithm | Precision | Recall | Coverage | Speed |
|-----------|-----------|--------|----------|-------|
| Collaborative | 0.42 | 0.38 | High | Fast |
| Content-Based | 0.45 | 0.35 | Medium | Fast |
| Hybrid | 0.48 | 0.41 | High | Medium |
| FBT | 0.55 | 0.28 | Low | Fast |
| Segment-Based | 0.39 | 0.42 | High | Fast |
| Reorder | 0.62 | 0.31 | Low | Fast |

---

## 🧪 Testing Examples

### cURL: Get Personalized Recommendations
```bash
curl -X GET "http://localhost:8000/api/v1/products/recommendations?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### cURL: Get FBT Recommendations
```bash
curl -X GET "http://localhost:8000/api/v1/products/fbt-recommendations/550e8400-...?limit=4"
```

### cURL: Hybrid Recommendations
```bash
curl -X GET "http://localhost:8000/api/v1/products/recommendations/hybrid?limit=10&cf_weight=0.5&content_weight=0.3&trending_weight=0.2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
