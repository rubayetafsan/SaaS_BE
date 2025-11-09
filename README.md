<!-- readme.md -->

# SaaS Backend API

A secure, production-ready SaaS backend providing algorithm-as-a-service with comprehensive features including Role-Based Access Control (RBAC), Two-Factor Authentication (2FA), Email Verification, Stripe Payments, and subscription management.

## 🌟 Key Features

- **🔐 Advanced Security**
  - Email Verification on Registration
  - Two-Factor Authentication (TOTP) with Backup Codes
  - Trusted Device Management (7-day device memory)
  - JWT Authentication with Encrypted Payloads
  - AES-256 Encryption for Sensitive Data
  - Rate Limiting on All Endpoints

- **👥 Role-Based Access Control (RBAC)**
  - 5-Tier Role Hierarchy: OWNER → ADMIN → MAINTAINER → SUBSCRIBED_USER → GUEST
  - Granular Permission System
  - Guest Access with 5-Hour Expiration

- **💳 Stripe Payment Integration**
  - Subscription Management
  - One-Time Payments
  - Webhook Processing
  - Multiple Service Tiers

- **🧮 Algorithm Services**
  - Data Analysis
  - Machine Learning Prediction
  - Text Analysis
  - Time Series Analysis
  - Sentiment Analysis
  - Linear Regression
  - Recommendation System

- **🔑 API Key Management**
  - Secure Key Generation
  - Usage Tracking
  - Expiration Management
  - Service-Based Access Control

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Starting the Server](#starting-the-server)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Service Plans](#service-plans)
8. [Authentication System](#authentication-system)
9. [API Documentation](#api-documentation)
10. [Available Algorithms](#available-algorithms)
11. [Security Features](#security-features)
12. [Development](#development)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18 or higher
- **MariaDB/MySQL** database
- **Yarn** package manager
- **Stripe Account** (for payment processing)
- **Gmail/SMTP** (for email services)

---

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd backend
yarn install
```

### 2. Quick Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This script will:

- Create `.env` file with random secrets
- Install dependencies
- Generate Prisma client
- Run database migrations
- Seed initial data

---

## Environment Configuration

### Generate Secure Secrets

```bash
# Generate JWT Access Secret
node -e "console.log('JWT_ACCESS_SECRET=\"' + require('crypto').randomBytes(64).toString('hex') + '\"')"

# Generate JWT Refresh Secret
node -e "console.log('JWT_REFRESH_SECRET=\"' + require('crypto').randomBytes(64).toString('hex') + '\"')"

# Generate Encryption Key
node -e "console.log('ENCRYPTION_KEY=\"' + require('crypto').randomBytes(32).toString('hex') + '\"')"
```

### Complete `.env` File

```env
# Server Configuration
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL="mysql://root:password@localhost:3306/secure_database?connection_limit=10&pool_timeout=20"

# JWT Secrets (use generated values above)
JWT_ACCESS_SECRET="your_generated_access_secret_here"
JWT_REFRESH_SECRET="your_generated_refresh_secret_here"

# Encryption Key (use generated value above)
ENCRYPTION_KEY="your_generated_encryption_key_here"

# Owner Account (set these before seeding!)
OWNER_USERNAME=""
OWNER_EMAIL=""
OWNER_PASSWORD=""

# Email Configuration (Gmail Example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=youremail@gmail.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Gmail App Password Setup

1. Enable 2-Step Verification in Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in `EMAIL_PASSWORD`

### Stripe Setup

1. Get keys from: https://dashboard.stripe.com/test/apikeys
2. Create products and prices in Stripe Dashboard
3. Update service price IDs in `scripts/update-stripe-prices.ts`

---

## Database Setup

### Option 1: Fresh Setup

```bash
# Generate Prisma Client
yarn prisma:generate

# Run migrations // mysql > DROP DATABASE IF EXISTS secure_database;
yarn prisma:migrate

# Seed database
yarn prisma:seed
```

### Option 2: Complete Reset

```bash
# Reset everything and start fresh
yarn db:clean-setup
```

### Option 3: Individual Commands

```bash
yarn prisma:generate    # Generate Prisma client
yarn prisma:migrate     # Run migrations
yarn prisma:seed        # Seed data
yarn prisma:studio      # Open database GUI
yarn prisma:reset       # Reset database
```

---

## Starting the Server

### Development Mode

```bash
yarn dev
```

### Production Mode

```bash
yarn build
yarn start
```

### With Stripe Webhooks (Separate Terminal)

```bash
yarn stripe:local
```

Server will start at:

- **API**: http://localhost:4000
- **GraphQL**: http://localhost:4000/graphql
- **API Docs**: http://localhost:4000/docs (dev only)
- **Health**: http://localhost:4000/health

---

## User Roles & Permissions

### Role Hierarchy (Level 5 → Level 1)

| Role                | Level | Description            | Key Permissions                                                   |
| ------------------- | ----- | ---------------------- | ----------------------------------------------------------------- |
| **OWNER**           | 5     | Ultimate administrator | Full access to everything, cannot be managed                      |
| **ADMIN**           | 4     | System administrator   | Manage users (except OWNER), change roles (except to OWNER)       |
| **MAINTAINER**      | 3     | Service manager        | Manage subscriptions, API keys, view all resources                |
| **SUBSCRIBED_USER** | 2     | Paid user              | Access based on subscription plan, manage own resources           |
| **GUEST**           | 1     | Free trial user        | Limited access (20 req/hour), 2 algorithms, expires every 5 hours |

### Permission Matrix

| Action                      | OWNER | ADMIN | MAINTAINER | SUBSCRIBED_USER | GUEST    |
| --------------------------- | ----- | ----- | ---------- | --------------- | -------- |
| **User Management**         |
| View all users              | ✅    | ✅    | ❌         | ❌              | ❌       |
| Change user roles           | ✅    | ✅\*  | ❌         | ❌              | ❌       |
| Delete users                | ✅    | ✅\*  | ❌         | ❌              | ❌       |
| **Subscription Management** |
| View all subscriptions      | ✅    | ✅    | ✅         | ❌              | ❌       |
| Cancel subscriptions        | ✅    | ✅    | ✅         | Own only        | ❌       |
| Create manual subscriptions | ✅    | ✅    | ✅         | ❌              | ❌       |
| **API Key Management**      |
| View all API keys           | ✅    | ✅    | ✅         | ❌              | ❌       |
| Revoke any API key          | ✅    | ✅    | ✅         | ❌              | ❌       |
| Create own API keys         | ✅    | ✅    | ✅         | ✅              | ❌\*\*   |
| **Algorithm Execution**     |
| Execute algorithms          | ✅    | ✅    | ✅         | ✅              | ✅\*\*\* |
| **Guest-Specific**          |
| Renew guest access          | ❌    | ❌    | ❌         | ❌              | ✅       |

\* Admin cannot manage OWNER accounts or promote to OWNER  
\*\* Guests must subscribe first to create API keys  
\*\*\* Limited to `dataAnalysis` and `textAnalysis` only

### Default Accounts (After Seeding)

```
Owner Account:
  Email: owner@onesaas.de (from .env)
  Password: OneSaaS@2025 (from .env)
  Role: OWNER
```

⚠️ **SECURITY WARNING**: Change these credentials immediately in production!

---

## Service Plans

| Plan                | Price     | Algorithms | Rate Limit | Features                                                                                 |
| ------------------- | --------- | ---------- | ---------- | ---------------------------------------------------------------------------------------- |
| **Guest Access**    | FREE      | 2          | 20/hour    | • dataAnalysis<br>• textAnalysis<br>• Expires every 5 hours<br>• Manual renewal required |
| **Basic Plan**      | $9.99/mo  | 2          | 100/hour   | • dataAnalysis<br>• textAnalysis                                                         |
| **Pro Plan**        | $29.99/mo | 5          | 500/hour   | • Basic algorithms<br>• mlPrediction<br>• sentimentAnalysis<br>• timeSeriesAnalysis      |
| **Enterprise Plan** | $99.99/mo | 7          | 5000/hour  | • All Pro algorithms<br>• recommendation<br>• linearRegression<br>• Priority support     |

---

## Authentication System

### Complete Authentication Flow

```mermaid
graph TD
    A[Register] --> B[Email Verification]
    B --> C[Login]
    C --> D{2FA Enabled?}
    D -->|No| E[Access Granted]
    D -->|Yes| F{Trusted Device?}
    F -->|Yes| E
    F -->|No| G[Enter 2FA Code]
    G --> H{Remember Device?}
    H -->|Yes| I[Save Device for 7 days]
    H -->|No| E
    I --> E
```

### 1. Registration with Email Verification

**GraphQL Mutation:**

```graphql
mutation Register {
  register(
    username: "john_doe"
    email: "john@example.com"
    password: "SecurePass123!@#"
  ) {
    success
    message
  }
}
```

**What Happens:**

1. User receives verification email with:
   - Clickable verification link
   - Manual verification code
2. Account is created with `GUEST` role
3. Email must be verified before login

### 2. Email Verification

**Option A: Click Link in Email**

- Link format: `http://localhost:4000/api/auth/verify-email-link?token={TOKEN}`
- Opens in browser with success page

**Option B: Manual Code Entry**

```graphql
mutation VerifyEmail {
  verifyEmail(token: "verification_token_from_email") {
    success
    message
  }
}
```

### 3. Login (Without 2FA)

```graphql
mutation Login {
  login(email: "john@example.com", password: "SecurePass123!@#") {
    accessToken
    refreshToken
    requiresTwoFactor
    user {
      id
      username
      email
      role
      guestAccessExpiresAt
    }
  }
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "requiresTwoFactor": false
}
```

**Set Authorization Header:**

```
Authorization: Bearer {accessToken}
```

### 4. Two-Factor Authentication Setup

**Step 1: Setup 2FA**

```graphql
mutation Setup2FA {
  setup2FA {
    secret
    qrCode
    message
  }
}
```

**Response:**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Scan the QR code with your authenticator app"
}
```

**Step 2: Enable 2FA**

```graphql
mutation Enable2FA {
  enable2FA(token: "123456") {
    success
    message
    backupCodes
    warning
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "backupCodes": [
    "98010F18",
    "8CA89065",
    "DC2450FE",
    "8FAD0E0B",
    "21C60989",
    "0589532F",
    "66371ED2",
    "11426BC6",
    "D5B30ABF",
    "D51B4703"
  ],
  "warning": "Save these backup codes in a safe place"
}
```

⚠️ **IMPORTANT**: Save backup codes securely! They can only be used once.

### 5. Login with 2FA

```graphql
mutation LoginWith2FA {
  login(
    email: "john@example.com"
    password: "SecurePass123!@#"
    twoFactorCode: "123456"
    rememberDevice: true
  ) {
    accessToken
    refreshToken
    deviceToken
    user {
      id
      username
      email
    }
  }
}
```

**Trusted Device Feature:**

- If `rememberDevice: true`, device is saved for 7 days
- Returns `deviceToken` to skip 2FA on this device
- Store `deviceToken` securely in local storage

### 6. Logout

```graphql
mutation Logout {
  logout
}
```

### 7. Token Refresh

```graphql
mutation RefreshToken {
  refreshToken(refreshToken: "your_refresh_token") {
    accessToken
    refreshToken
    user {
      id
      username
      email
    }
  }
}
```

**Token Lifetimes:**

- Access Token: 15 minutes
- Refresh Token: 7 days
- Guest Access: 5 hours (renewable)
- Trusted Device: 7 days

---

## API Documentation

### GraphQL Endpoint

**URL**: `http://localhost:4000/graphql`

**Headers:**

```json
{
  "Authorization": "Bearer {accessToken}",
  "Content-Type": "application/json"
}
```

For detailed query examples, see [README2.md](./README2.md)

### REST API Endpoints

#### Health & Documentation

| Method | Endpoint  | Description                            | Auth Required |
| ------ | --------- | -------------------------------------- | ------------- |
| GET    | `/health` | System health check with all endpoints | No            |
| GET    | `/docs`   | Swagger API documentation              | No (dev only) |

#### Authentication

| Method | Endpoint                        | Description               |
| ------ | ------------------------------- | ------------------------- |
| POST   | `/api/auth/register`            | Register new user         |
| POST   | `/api/auth/login`               | User login                |
| POST   | `/api/auth/verify-email`        | Verify email (POST)       |
| GET    | `/api/auth/verify-email-link`   | Verify email (link)       |
| POST   | `/api/auth/resend-verification` | Resend verification email |
| POST   | `/api/auth/2fa/setup`           | Setup 2FA                 |
| POST   | `/api/auth/2fa/enable`          | Enable 2FA                |
| POST   | `/api/auth/2fa/disable`         | Disable 2FA               |
| POST   | `/api/auth/2fa/backup-codes`    | Generate backup codes     |
| GET    | `/api/auth/trusted-devices`     | Get trusted devices       |
| DELETE | `/api/auth/trusted-devices/:id` | Remove trusted device     |

#### Services

| Method | Endpoint                         | Description               | Auth        |
| ------ | -------------------------------- | ------------------------- | ----------- |
| GET    | `/api/services`                  | List all services         | No          |
| POST   | `/api/services/subscribe`        | Subscribe to service      | JWT         |
| GET    | `/api/services/my-subscriptions` | Get user subscriptions    | JWT         |
| PUT    | `/api/services/:id/algorithms`   | Update service algorithms | Admin/Owner |

#### API Keys

| Method | Endpoint                   | Description          | Auth |
| ------ | -------------------------- | -------------------- | ---- |
| GET    | `/api/api-keys`            | List user's API keys | JWT  |
| POST   | `/api/api-keys/create`     | Create new API key   | JWT  |
| POST   | `/api/api-keys/:id/revoke` | Revoke API key       | JWT  |
| DELETE | `/api/api-keys/:id`        | Delete API key       | JWT  |

#### User Management

| Method | Endpoint                 | Description        | Auth                       |
| ------ | ------------------------ | ------------------ | -------------------------- |
| GET    | `/api/users`             | List all users     | Admin/Owner                |
| GET    | `/api/users/:id`         | Get user by ID     | Owner of account or Admin+ |
| PUT    | `/api/users/:id/role`    | Change user role   | Admin/Owner                |
| DELETE | `/api/users/:id`         | Delete user        | Admin/Owner                |
| POST   | `/api/users/guest/renew` | Renew guest access | Guest only                 |

#### Algorithms

| Method | Endpoint                  | Description       | Auth    |
| ------ | ------------------------- | ----------------- | ------- |
| POST   | `/api/algorithms/execute` | Execute algorithm | API Key |

#### Stripe

| Method | Endpoint                               | Description         | Auth              |
| ------ | -------------------------------------- | ------------------- | ----------------- |
| GET    | `/api/stripe/config`                   | Get publishable key | No                |
| POST   | `/api/stripe/create-checkout-session`  | Create checkout     | JWT               |
| POST   | `/api/stripe/create-payment-intent`    | Create payment      | JWT               |
| GET    | `/api/stripe/subscriptions`            | Get subscriptions   | JWT               |
| POST   | `/api/stripe/subscriptions/:id/cancel` | Cancel subscription | JWT               |
| POST   | `/api/stripe/subscriptions/:id/resume` | Resume subscription | JWT               |
| POST   | `/api/stripe/webhook`                  | Stripe webhook      | Webhook signature |

---

## Available Algorithms

### 1. Data Analysis

**Description**: Statistical analysis of numerical data

**Example Request:**

```bash
curl -X POST http://localhost:4000/api/algorithms/execute \
  -H "X-API-Key: sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "algorithmName": "dataAnalysis",
    "data": {
      "numbers": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "result": {
    "sum": 550,
    "average": 55,
    "min": 10,
    "max": 100,
    "count": 10
  },
  "executionTime": 2
}
```

**Available In**: All plans (including Guest)

---

### 2. Text Analysis

**Description**: Word count, character count, sentence analysis

**Example Request:**

```json
{
  "algorithmName": "textAnalysis",
  "data": {
    "text": "This is a sample text for analysis. It contains multiple sentences."
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "wordCount": 11,
    "characterCount": 66,
    "sentenceCount": 2
  },
  "executionTime": 1
}
```

**Available In**: All plans (including Guest)

---

### 3. ML Prediction

**Description**: Weighted machine learning predictions

**Example Request:**

```json
{
  "algorithmName": "mlPrediction",
  "data": {
    "features": [0.8, 0.6, 0.9, 0.3, 0.7],
    "weights": [0.3, 0.25, 0.2, 0.15, 0.1]
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "prediction": 0.697,
    "confidence": 0.87
  },
  "executionTime": 1
}
```

**Available In**: Pro, Enterprise

---

### 4. Sentiment Analysis

**Description**: Analyze text sentiment (positive/negative/neutral)

**Example Request:**

```json
{
  "algorithmName": "sentimentAnalysis",
  "data": {
    "text": "I love this product! It's amazing and works great."
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "sentiment": "positive",
    "score": 0.67
  },
  "executionTime": 1
}
```

**Available In**: Pro, Enterprise

---

### 5. Time Series Analysis

**Description**: Trend analysis and forecasting

**Example Request:**

```json
{
  "algorithmName": "timeSeriesAnalysis",
  "data": {
    "values": [100, 110, 105, 120, 130, 125, 140],
    "periods": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "trend": "increasing",
    "forecast": [145, 150, 155]
  },
  "executionTime": 2
}
```

**Available In**: Pro, Enterprise

---

### 6. Linear Regression

**Description**: Calculate linear relationship between variables

**Example Request:**

```json
{
  "algorithmName": "linearRegression",
  "data": {
    "x": [1, 2, 3, 4, 5],
    "y": [2, 4, 5, 4, 5]
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "slope": 0.6,
    "intercept": 2.2,
    "equation": "y = 0.6x + 2.2"
  },
  "executionTime": 1
}
```

**Available In**: Enterprise

---

### 7. Recommendation System

**Description**: Generate personalized recommendations

**Example Request:**

```json
{
  "algorithmName": "recommendation",
  "data": {
    "userPreferences": [0.9, 0.3, 0.6, 0.8, 0.4],
    "itemFeatures": [
      [0.95, 0.2, 0.3, 0.7, 0.1],
      [0.4, 0.9, 0.5, 0.2, 0.8],
      [0.85, 0.3, 0.7, 0.9, 0.2]
    ],
    "topN": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "recommendations": [
      { "itemIndex": 2, "score": 0.978 },
      { "itemIndex": 0, "score": 0.951 },
      { "itemIndex": 1, "score": 0.892 }
    ]
  },
  "executionTime": 2
}
```

**Available In**: Enterprise

---

## Security Features

### 🔐 Authentication & Authorization

- **JWT Tokens** with encrypted payloads
- **Two-Factor Authentication** (TOTP) with Google Authenticator support
- **Backup Codes** for 2FA recovery (10 one-time codes)
- **Trusted Device Management** (7-day device memory)
- **Email Verification** required for all accounts
- **Role-Based Access Control** with 5-tier hierarchy

### 🛡️ Data Protection

- **AES-256 Encryption** for sensitive data (emails)
- **bcrypt** password hashing (12 salt rounds)
- **Encrypted JWT Payloads** (double encryption)
- **API Key Hashing** before storage
- **HTTPS Required** in production
- **Secure Headers** via Helmet.js

### ⚡ Rate Limiting

- **Authentication Endpoints**: 100 requests/hour
- **General API**: 10,000 requests/hour
- **Service-Based Limits**: Per subscription plan
- **Guest Users**: 20 requests/hour

### 🔒 Additional Security

- **CORS Protection** with configurable origins
- **Input Validation** with Zod schemas
- **SQL Injection Protection** via Prisma
- **XSS Protection** via input sanitization
- **Token Revocation** system
- **Session Management** with refresh tokens

---

## Development

### Available Scripts

```bash
# Development
yarn dev                    # Start dev server with hot reload
yarn build                  # Build for production
yarn start                  # Start production server

# Database
yarn prisma:generate        # Generate Prisma client
yarn prisma:migrate         # Run migrations
yarn prisma:seed            # Seed database
yarn prisma:studio          # Open Prisma Studio GUI
yarn prisma:reset           # Reset database
yarn db:clean-setup         # Complete reset + setup
yarn db:push-setup          # Force push schema + seed

# Stripe
yarn stripe:local           # Start Stripe webhook listener

# Code Quality
yarn format                 # Format with Prettier
yarn duplication            # Check code duplication

# Utilities
node scripts/sync-services.ts              # Sync service configs
node scripts/update-stripe-prices.ts       # Update Stripe price IDs
```

### Project Structure

```
backend/
├── src/
│   ├── algorithms/          # Algorithm implementations
│   │   ├── dataAnalysis.ts
│   │   ├── mlPrediction.ts
│   │   ├── textAnalysis.ts
│   │   ├── timeSeriesAnalysis.ts
│   │   ├── sentimentAnalysis.ts
│   │   ├── linearRegression.ts
│   │   ├── recommendation.ts
│   │   └── types.ts
│   ├── api/
│   │   ├── algorithms/      # Algorithm REST routes
│   │   ├── apiKeys/         # API key management
│   │   ├── auth/            # Authentication routes
│   │   │   ├── routes/
│   │   │   │   ├── registration.ts
│   │   │   │   ├── login.ts
│   │   │   │   ├── twoFactor.ts
│   │   │   │   └── trustedDevices.ts
│   │   │   └── handlers/
│   │   ├── graphql/         # GraphQL API
│   │   │   ├── resolvers/
│   │   │   │   ├── auth/
│   │   │   │   ├── user/
│   │   │   │   ├── service/
│   │   │   │   ├── subscription/
│   │   │   │   ├── apiKey/
│   │   │   │   └── algorithm/
│   │   │   └── schema/
│   │   ├── health/          # Health check endpoint
│   │   ├── services/        # Service management
│   │   ├── stripe/          # Stripe integration
│   │   ├── userManagement/  # User CRUD operations
│   │   └── validation/      # Request validation schemas
│   ├── config/              # Configuration
│   │   ├── env.ts           # Environment variables
│   │   ├── services.config.ts  # Service tiers (SSOT)
│   │   └── stripe.ts        # Stripe configuration
│   ├── middleware/          # Middleware functions
│   │   ├── auth.ts          # JWT authentication
│   │   ├── apiKeyAuth.ts    # API key validation
│   │   ├── roleAuth.ts      # RBAC permissions
│   │   ├── rateLimiter.ts   # Rate limiting
│   │   └── validate.ts      # Input validation
│   ├── services/            # Business logic services
│   │   ├── emailService.ts  # Email sending
│   │   ├── stripeService.ts # Stripe operations
│   │   └── twoFactorService.ts  # 2FA logic
│   ├── utils/               # Utility functions
│   │   ├── algorithms.ts    # Algorithm helpers
│   │   ├── apiKey.ts        # API key utilities
│   │   ├── encryption.ts    # AES-256 encryption
│   │   ├── jwt.ts           # JWT operations
│   │   ├── password.ts      # Password hashing
│   │   └── validation.ts    # Input sanitization
│   ├── types/               # TypeScript types
│   │   └── context.ts       # GraphQL context
│   └── index.ts             # Application entry point
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding
├── scripts/                 # Utility scripts
│   ├── sync-services.ts     # Sync service configs
│   ├── update-stripe-prices.ts  # Update Stripe prices
│   └── stripe/
│       ├── test-payments.sh
│       └── test-comprehensive-cards.sh
├── .env.example             # Environment template
├── setup.sh                 # Quick setup script
├── reset-db.sh              # Database reset script
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── README.md                # This file
```

### Key Design Patterns

1. **Centralized Service Configuration**: `src/config/services.config.ts` is the single source of truth
2. **Modular Resolvers**: GraphQL resolvers organized by domain
3. **Helper Functions**: Shared logic extracted to helpers
4. **Type Safety**: Full TypeScript coverage with strict mode
5. **Error Handling**: Consistent error responses across all endpoints

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem**: Cannot connect to database

**Solutions**:

```bash
# 1. Check if MariaDB/MySQL is running
brew services list  # macOS
systemctl status mysql  # Linux

# 2. Verify DATABASE_URL in .env
# 3. Test connection
yarn prisma:studio
```

#### Authentication Errors

**Problem**: 401 Unauthorized or token expired

**Solutions**:

- Ensure Authorization header: `Bearer {token}`
- Check token expiration (access: 15min, refresh: 7days)
- Use refresh token to get new access token
- Verify email is verified

#### Email Verification Not Working

**Problem**: Verification email not received

**Solutions**:

1. Check spam folder
2. Verify EMAIL\_\* variables in .env
3. For Gmail: ensure App Password is used (not account password)
4. Check server logs for email errors
5. Use resend verification mutation

#### Guest Access Expired

**Problem**: "Guest access has expired" error

**Solutions**:

```graphql
# Renew guest access (5 more hours)
mutation {
  renewGuestAccess {
    success
    expiresAt
  }
}

# Or subscribe to upgrade role
mutation {
  subscribeToService(serviceId: "service_id") {
    id
    status
  }
}
```

#### API Key Permission Errors

**Problem**: Algorithm not allowed for API key

**Solutions**:

1. Check your service plan algorithms
2. Verify subscription is active
3. Guest users: only dataAnalysis and textAnalysis allowed
4. Upgrade to higher tier for more algorithms

#### Stripe Webhook Issues

**Problem**: Webhooks not processing

**Solutions**:

```bash
# 1. Start webhook listener
yarn stripe:local

# 2. Check webhook secret in .env
# 3. Verify webhook URL in Stripe Dashboard

# 4. Test with Stripe CLI
stripe trigger checkout.session.completed
```

#### 2FA Not Working

**Problem**: Invalid 2FA code

**Solutions**:

1. Ensure device time is synchronized (TOTP is time-based)
2. Try backup code instead
3. Check authenticator app is using correct secret
4. Generate new backup codes if needed

#### Role Permission Denied

**Problem**: "Insufficient permissions" error

**Solutions**:

1. Check your current role: `query { me { role } }`
2. Review permission matrix above
3. Admin cannot manage OWNER accounts
4. Request role upgrade from OWNER/ADMIN

---

## API Rate Limits

| User Type      | Rate Limit      | Period | Notes                           |
| -------------- | --------------- | ------ | ------------------------------- |
| Guest          | 20 requests     | 1 hour | Must renew every 5 hours        |
| Basic Plan     | 100 requests    | 1 hour | -                               |
| Pro Plan       | 500 requests    | 1 hour | -                               |
| Enterprise     | 5000 requests   | 1 hour | -                               |
| Auth Endpoints | 100 requests    | 1 hour | All users                       |
| General API    | 10,000 requests | 1 hour | Rate limit bypass for high-tier |

---

## Testing

### Testing Stripe Payments

```bash
# Run comprehensive card tests
./scripts/stripe/test-comprehensive-cards.sh

# Or quick payment test
./scripts/stripe/test-payments.sh
```

**Test Cards**:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Testing 2FA

1. Setup 2FA with test user
2. Scan QR code in authenticator app
3. Enable with 6-digit code
4. Save backup codes
5. Test login with 2FA
6. Test trusted device feature
7. Test backup code (use once only!)

---

## Production Deployment Checklist

- [ ] Change default Owner credentials
- [ ] Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set secure `ENCRYPTION_KEY`
- [ ] Configure production DATABASE_URL
- [ ] Set correct `API_URL` and `FRONTEND_URL`
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Configure production email service
- [ ] Set Stripe live keys (not test keys)
- [ ] Configure Stripe webhook endpoint in dashboard
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure monitoring and logging
- [ ] Review and adjust rate limits
- [ ] Test all authentication flows
- [ ] Verify email delivery in production
- [ ] Test Stripe webhook processing
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Configure CDN for static assets
- [ ] Setup SSL certificates
- [ ] Review security headers

---

## Support & Resources

- **Health Check**: http://localhost:4000/health
- **API Documentation**: http://localhost:4000/docs (dev)
- **GraphQL Playground**: http://localhost:4000/graphql
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Prisma Studio**: `yarn prisma:studio`

### Useful Links

- Stripe Test Cards: https://stripe.com/docs/testing
- Google Authenticator: iOS/Android app stores
- Prisma Documentation: https://www.prisma.io/docs
- GraphQL Documentation: https://graphql.org/learn

---

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines Here]

---

**Made with ❤️ using Node.js, TypeScript, Prisma, GraphQL, and Stripe**
