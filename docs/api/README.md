# E-Commerce Recommendation System - API Documentation

## 📋 Overview

This is a comprehensive REST API for an AI-powered e-commerce platform with advanced recommendation engines, user analytics, and administrative capabilities.

**Base URL:** `http://localhost:8000/api/v1`

**API Version:** v1

**Framework:** FastAPI with SQLAlchemy ORM

---

## 🔐 Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Token Types

- **Access Token**: Short-lived token for API requests (expires in 30 minutes by default)
- **Refresh Token**: Long-lived token for obtaining new access tokens (expires in 7 days)

### Getting Started

1. **Register** a new user: `POST /auth/register`
2. **Login** to get tokens: `POST /auth/login`
3. **Use access token** in subsequent requests
4. **Refresh** when access token expires: `POST /auth/refresh`

---

## 📚 API Categories

### 🔑 [Authentication](./01-authentication.md)
User registration, login, token management, and profile operations.

### 🛍️ [Products](./02-products.md)
Product listing, search, categories, and product details.

### 🤖 [Recommendations](./03-recommendations.md)
Multiple recommendation algorithms:
- Collaborative Filtering
- Content-Based Filtering
- Hybrid Recommendations
- Frequently Bought Together (FBT)
- Segment-Based Recommendations
- Personalized Trending
- Reorder Predictions

### 🛒 [Cart & Orders](./04-cart-orders.md)
Shopping cart management and order processing.

### 👤 [User & Behavior](./05-user-behavior.md)
User profiles, wishlist, behavior tracking, and notifications.

### 📊 [Admin - Analytics](./06-admin-analytics.md)
Business intelligence, KPIs, dashboards, and reporting.

### 🧠 [Admin - ML Models](./07-admin-ml-models.md)
Machine learning model management, training, and monitoring.

### ⚙️ [Admin - Management](./08-admin-management.md)
User management, product management, order management, system settings.

---

## 🌐 Common Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Paginated Response
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

## 📝 Common Query Parameters

### Pagination
- `page` (integer): Page number (default: 1)
- `size` (integer): Items per page (default: 20, max: 100)

### Filtering
- `category_id` (UUID): Filter by category
- `min_price` / `max_price` (float): Price range
- `is_active` (boolean): Active/inactive filter
- `search` (string): Search term

### Sorting
- `sort_by` (string): Field to sort by
- `order` (string): `asc` or `desc`

---

## 🚀 Rate Limiting

- **Anonymous users**: 100 requests per minute
- **Authenticated users**: 500 requests per minute
- **Admin users**: 1000 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 499
X-RateLimit-Reset: 1699564800
```

---

## 🔧 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 🧪 Testing

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Example cURL Request

```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'

# Get products (authenticated)
curl -X GET "http://localhost:8000/api/v1/products" \
  -H "Authorization: Bearer <your_access_token>"
```

---

## 📦 Quick Start

1. **Start the services**:
   ```bash
   docker-compose up
   ```

2. **Access the API**: http://localhost:8000/api/v1

3. **Default admin credentials**:
   - Email: `admin@ecommerce.com`
   - Password: `password123`

---

## 📖 Detailed Documentation

Click on the links above to view detailed documentation for each API category, including:
- Endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error scenarios

---

## 🆘 Support

For issues or questions:
- Check the [Swagger documentation](http://localhost:8000/docs)
- Review the API category docs linked above
- Check application logs: `docker-compose logs -f backend`
