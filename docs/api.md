# API Documentation

Complete API documentation is available at:
- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc (Alternative documentation)

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

**POST** `/api/v1/auth/login`

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

## Main API Endpoints

### Products

- `GET /api/v1/products` - List products
- `GET /api/v1/products/{id}` - Get product details
- `GET /api/v1/products/recommendations` - Get personalized recommendations
- `GET /api/v1/products/trending` - Get trending products
- `POST /api/v1/products/search` - Search products

### Cart

- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/{id}` - Update cart item
- `DELETE /api/v1/cart/items/{id}` - Remove item from cart

### Orders

- `GET /api/v1/orders` - List user orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order details

### Admin Endpoints

All admin endpoints require admin role and appropriate permissions.

#### Products Management
- `POST /api/v1/admin/products` - Create product
- `PUT /api/v1/admin/products/{id}` - Update product
- `DELETE /api/v1/admin/products/{id}` - Delete product

#### ML Models Management
- `GET /api/v1/admin/dashboard/ml-configs` - List ML configurations
- `POST /api/v1/admin/dashboard/train` - Trigger model training
- `GET /api/v1/admin/dashboard/training/history` - Get training history

For complete API documentation with all parameters and examples, visit http://localhost:8000/docs
