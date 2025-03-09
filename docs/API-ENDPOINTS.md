# API Endpoints Documentation

This document provides a comprehensive list of all API endpoints in the PMU Profit System, including request/response examples.

## Table of Contents

1. [Authentication API](#authentication-api)
2. [User Data API](#user-data-api)
3. [Payment API](#payment-api)
4. [Entitlements API](#entitlements-api)
5. [Products API](#products-api)
6. [Ad Generator API](#ad-generator-api)

---

## Authentication API

### POST /api/auth/signup

Creates a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/signin

Signs in an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /api/auth/signout

Signs out the current user.

**Response:**
```json
{
  "success": true
}
```

---

## User Data API

### GET /api/user/profile

Gets the current user's profile information.

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2023-01-01T00:00:00Z"
}
```

### POST /api/user/profile

Updates the current user's profile information.

**Request:**
```json
{
  "full_name": "John Smith"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Smith",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

---

## Payment API

### POST /api/checkout/create-session

Creates a Stripe checkout session for purchasing products.

**Request:**
```json
{
  "email": "user@example.com",
  "products": ["pmu-profit-system"],
  "metadata": {
    "includeAdGenerator": true
  }
}
```

**Response:**
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6g7h8i9j0"
}
```

### POST /api/webhook/stripe

Processes Stripe webhook events.

**Request:** Stripe webhook event payload

**Response:**
```json
{
  "received": true
}
```

---

## Entitlements API

### GET /api/user-entitlements

Gets the current user's entitlements. This endpoint uses the service role client to bypass RLS policies, ensuring reliable access to entitlement data.

**Request Headers:**
- `x-user-id`: (Optional) The user's ID

**Query Parameters:**
- `userId`: (Optional) The user's ID

**Response:**
```json
{
  "authenticated": true,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "entitlements": [
    {
      "id": "456e7890-e12b-34d5-a678-426614174000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_id": "4a554622-d759-42b7-b830-79c9136d2f96",
      "source_type": "purchase",
      "source_id": "789e0123-e45b-67d8-a901-426614174000",
      "valid_from": "2023-01-01T00:00:00Z",
      "valid_until": null,
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "products": {
        "id": "4a554622-d759-42b7-b830-79c9136d2f96",
        "name": "PMU Profit System",
        "description": "Complete PMU business system",
        "price": 37.00,
        "type": "course",
        "currency": "EUR",
        "active": true
      }
    }
  ],
  "entitlementCount": 1
}
```

### POST /api/create-entitlements-from-purchases

Creates entitlements for a user based on their completed purchases. This endpoint is called asynchronously when a user has purchases but no entitlements.

**Request Headers:**
- `x-user-id`: (Optional) The user's ID

**Query Parameters:**
- `userId`: (Optional) The user's ID

**Response:**
```json
{
  "success": true,
  "entitlements": [
    {
      "id": "456e7890-e12b-34d5-a678-426614174000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "product_id": "4a554622-d759-42b7-b830-79c9136d2f96",
      "source_type": "purchase",
      "source_id": "789e0123-e45b-67d8-a901-426614174000",
      "valid_from": "2023-01-01T00:00:00Z",
      "valid_until": null,
      "is_active": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "entitlementCount": 1
}
```

---

## Products API

### GET /api/products

Gets all active products. This endpoint uses the service role client to bypass RLS policies, ensuring reliable access to product data.

**Response:**
```json
{
  "products": [
    {
      "id": "4a554622-d759-42b7-b830-79c9136d2f96",
      "name": "PMU Profit System",
      "description": "Complete PMU business system",
      "price": 37.00,
      "type": "course",
      "currency": "EUR",
      "active": true,
      "metadata": {
        "features": ["Video lessons", "Worksheets", "Community access"]
      }
    },
    {
      "id": "4ba5c775-a8e4-449e-828f-19f938e3710b",
      "name": "PMU Ad Generator",
      "description": "AI-powered ad creation tool for PMU professionals",
      "price": 27.00,
      "type": "tool",
      "currency": "EUR",
      "active": true,
      "metadata": {
        "features": ["AI-generated ads", "Customizable templates", "Export options"]
      }
    }
  ],
  "count": 2
}
```

---

## Ad Generator API

### POST /api/ad-generator/generate

Generates ad copy using AI.

**Request:**
```json
{
  "prompt": "PMU services for brides",
  "options": {
    "tone": "professional",
    "length": "medium"
  }
}
```

**Response:**
```json
{
  "ads": [
    {
      "id": "ad_123456",
      "headline": "Perfect Brows for Your Perfect Day",
      "body": "Look your absolute best on your wedding day with our premium PMU services. Book your consultation today!",
      "cta": "Book Now"
    },
    {
      "id": "ad_234567",
      "headline": "Bridal Beauty That Lasts",
      "body": "Wake up wedding-ready with permanent makeup that stays flawless through tears of joy and dancing all night.",
      "cta": "Learn More"
    }
  ]
}
```

### POST /api/ad-generator/save

Saves generated ad copy.

**Request:**
```json
{
  "adId": "ad_123456",
  "content": {
    "headline": "Perfect Brows for Your Perfect Day",
    "body": "Look your absolute best on your wedding day with our premium PMU services. Book your consultation today!",
    "cta": "Book Now"
  }
}
```

**Response:**
```json
{
  "success": true,
  "savedAd": {
    "id": "saved_ad_789012",
    "adId": "ad_123456",
    "content": {
      "headline": "Perfect Brows for Your Perfect Day",
      "body": "Look your absolute best on your wedding day with our premium PMU services. Book your consultation today!",
      "cta": "Book Now"
    },
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```
