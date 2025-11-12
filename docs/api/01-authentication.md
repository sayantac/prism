# 🔑 Authentication API

All authentication-related endpoints for user registration, login, token management, and profile operations.

**Base Path:** `/api/v1/auth`

---

## Endpoints

### 1. Register New User

Register a new customer account.

**Endpoint:** `POST /auth/register`

**Authentication:** None required

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-11-12T10:30:00Z",
  "updated_at": "2025-11-12T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Username or email already registered
```json
{
  "detail": "Email already registered"
}
```

---

### 2. Login

Authenticate user and receive access/refresh tokens.

**Endpoint:** `POST /auth/login`

**Authentication:** None required

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Token Details:**
- `access_token`: Use for authenticated requests (expires in 30 minutes)
- `refresh_token`: Use to get new access tokens (expires in 7 days)
- `expires_in`: Access token lifetime in seconds

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
```json
{
  "detail": "Incorrect username or password"
}
```
- `400 Bad Request`: Inactive user
```json
{
  "detail": "Inactive user"
}
```

---

### 3. Refresh Access Token

Get a new access token using a refresh token.

**Endpoint:** `POST /auth/refresh`

**Authentication:** None required (refresh token in body)

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Notes:**
- Both tokens are rotated (new access + new refresh token)
- Old refresh token becomes invalid after use

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token
```json
{
  "detail": "Invalid refresh token"
}
```

---

### 4. Get Current User

Retrieve authenticated user's profile information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required (Bearer token)

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "US"
  },
  "preferences": {
    "currency": "USD",
    "language": "en",
    "newsletter": true
  },
  "interests": ["electronics", "books", "sports"],
  "is_active": true,
  "is_superuser": false,
  "last_login": "2025-11-12T10:30:00Z",
  "created_at": "2025-11-10T08:00:00Z",
  "updated_at": "2025-11-12T10:30:00Z"
}
```

---

### 5. Update Current User

Update authenticated user's profile information.

**Endpoint:** `PUT /auth/me`

**Authentication:** Required (Bearer token)

**Request Body:** (All fields optional)
```json
{
  "full_name": "John Smith",
  "phone": "+1987654321",
  "email": "newjohn@example.com",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90001",
    "country": "US"
  },
  "preferences": {
    "currency": "USD",
    "language": "en",
    "newsletter": false
  },
  "interests": ["technology", "gaming"]
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "newjohn@example.com",
  "full_name": "John Smith",
  "phone": "+1987654321",
  "address": {
    "street": "456 Oak Ave",
    "city": "Los Angeles",
    "state": "CA",
    "zip_code": "90001",
    "country": "US"
  },
  "preferences": {
    "currency": "USD",
    "language": "en",
    "newsletter": false
  },
  "interests": ["technology", "gaming"],
  "updated_at": "2025-11-12T11:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Duplicate email/phone/username
```json
{
  "detail": "Email already taken"
}
```

---

### 6. Logout

Invalidate user session (client should remove tokens).

**Endpoint:** `POST /auth/logout`

**Authentication:** Required (Bearer token)

**Response:** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

**Notes:**
- This is a client-side operation primarily
- Server logs the logout event
- Client must delete stored tokens

---

## 🔐 Security Best Practices

### Token Storage
- **Never** store tokens in localStorage (XSS vulnerable)
- Use httpOnly cookies or secure session storage
- Implement token rotation

### Password Requirements
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols recommended
- Passwords are hashed with bcrypt

### Token Expiration
- Access tokens: 30 minutes (short-lived)
- Refresh tokens: 7 days (long-lived)
- Implement automatic refresh before expiration

---

## 📝 Example Usage Flow

### Registration & Login Flow
```javascript
// 1. Register
const registerResponse = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

// 2. Login
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'SecurePass123!'
  })
});

const { access_token, refresh_token } = await loginResponse.json();

// 3. Use access token
const userResponse = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

### Token Refresh Flow
```javascript
// When access token expires
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refresh_token: refresh_token
  })
});

const { access_token: newAccessToken, refresh_token: newRefreshToken } 
  = await refreshResponse.json();

// Update stored tokens
```

---

## 🧪 Testing Endpoints

### cURL Examples

**Register:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "full_name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!"
  }'
```

**Get Profile:**
```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🚨 Common Errors

| Error Code | Cause | Solution |
|------------|-------|----------|
| 400 | Email/username taken | Use different credentials |
| 401 | Invalid credentials | Check username/password |
| 401 | Token expired | Refresh access token |
| 401 | Invalid token | Re-login |
| 403 | Inactive account | Contact admin |
