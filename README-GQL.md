<!-- readme-gql.md -->

# GraphQL Query Examples

Complete reference for all GraphQL queries and mutations with examples and expected outputs.

---

## 🔐 Authentication Required

Most mutations require authentication. Add this HTTP header after login:

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

---

## 📖 Query Reference

### Query 1: User Registration

**Mutation Template:**

```graphql
mutation Register($username: String!, $email: String!, $password: String!) {
  register(username: $username, email: $email, password: $password) {
    success
    message
  }
}
```

**Example Usage:**

```graphql
mutation Register {
  register(
    username: "ownerUser"
    email: "owner.user@email.com"
    password: "SecurePass123!@#"
  ) {
    success
    message
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "register": {
      "success": true,
      "message": "Registration successful! Please check your email to verify your account."
    }
  }
}
```

---

### Query 2: Email Verification

**Mutation Template:**

```graphql
mutation VerifyEmail($token: String!) {
  verifyEmail(token: $token) {
    success
    message
  }
}
```

**Example Usage:**

```graphql
mutation VerifyEmail {
  verifyEmail(token: "email_verification_token_from_email") {
    success
    message
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "verifyEmail": {
      "success": true,
      "message": "Email verified successfully! You can now log in."
    }
  }
}
```

---

### Query 3: Resend Email Verification

**Mutation Template:**

```graphql
mutation ResendVerification($email: String!) {
  resendVerification(email: $email) {
    success
    message
  }
}
```

**Example Usage:**

```graphql
mutation ResendVerification {
  resendVerification(email: "owner.user@email.com") {
    success
    message
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "resendVerification": {
      "success": true,
      "message": "Verification email sent successfully"
    }
  }
}
```

---

### Query 4: Login (Without 2FA)

**Mutation Template:**

```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    refreshToken
    requiresTwoFactor
    user {
      id
      username
      email
      role
      isEmailVerified
      twoFactorEnabled
      guestAccessExpiresAt
      createdAt
      subscriptions {
        id
        status
        expiresAt
        service {
          id
          name
          description
          price
          allowedAlgorithms
          rateLimit
          ratePeriod
          isActive
          createdAt
        }
      }
    }
  }
}
```

**Example Usage:**

```graphql
mutation Login {
  login(email: "owner.user@email.com", password: "SecurePass123!@#") {
    accessToken
    refreshToken
    requiresTwoFactor
    user {
      id
      username
      email
      role
      isEmailVerified
      twoFactorEnabled
      guestAccessExpiresAt
      createdAt
      subscriptions {
        id
        status
        expiresAt
        service {
          id
          name
          description
          price
          allowedAlgorithms
          rateLimit
          ratePeriod
          isActive
          createdAt
        }
      }
    }
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "login": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiI...",
      "requiresTwoFactor": false,
      "user": {
        "id": "cmhdva6yy0000...",
        "username": "ownerUser",
        "email": "owner.user@email.com",
        "role": "GUEST",
        "isEmailVerified": true,
        "twoFactorEnabled": false,
        "guestAccessExpiresAt": null,
        "createdAt": "2025-10-30T20:18:33.803Z",
        "subscriptions": []
      }
    }
  }
}
```

> ⚠️ **Important**: Copy the `accessToken` from the response and add it to your HTTP headers:
>
> ```json
> { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..." }
> ```

---

### Query 5: 2FA Setup

> 🔒 **Requires Authentication**: Add accessToken to "Authorization" Header

**Mutation:**

```graphql
mutation Setup2FA {
  setup2FA {
    secret
    qrCode
    message
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "setup2FA": {
      "secret": "JBSWY3DPEHPK3PXP",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "message": "Scan the QR code with your authenticator app"
    }
  }
}
```

> 📱 **Next Step**: Scan the QR code with Google Authenticator or similar app

---

### Query 6: Enable 2FA

**Mutation Template:**

```graphql
mutation Enable2FA($token: String!) {
  enable2FA(token: $token) {
    success
    message
    backupCodes
    warning
  }
}
```

**Example Usage:**

```graphql
mutation Enable2FA {
  enable2FA(token: "145805") {
    success
    message
    backupCodes
    warning
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "enable2FA": {
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
      "warning": "Save these backup codes in a safe place. They can only be used once."
    }
  }
}
```

> ⚠️ **Critical**: Save these backup codes immediately! They can only be used once and won't be shown again.

---

### Query 7: Logout

**Mutation:**

```graphql
mutation Logout {
  logout
}
```

**Expected Output:**

```json
{
  "data": {
    "logout": true
  }
}
```

---

### Query 8: Login with 2FA

**Mutation Template:**

```graphql
mutation LoginWith2FA(
  $email: String!
  $password: String!
  $twoFactorCode: String!
) {
  login(email: $email, password: $password, twoFactorCode: $twoFactorCode) {
    accessToken
    refreshToken
    requiresTwoFactor
    user {
      id
      username
      email
      role
      isEmailVerified
      twoFactorEnabled
      guestAccessExpiresAt
      createdAt
      subscriptions {
        id
        status
        expiresAt
        service {
          id
          name
          description
          price
          allowedAlgorithms
          rateLimit
          ratePeriod
          isActive
          createdAt
        }
      }
    }
  }
}
```

**Example Usage:**

```graphql
mutation LoginWith2FA {
  login(
    email: "owner.user@email.com"
    password: "SecurePass123!@#"
    twoFactorCode: "584772"
  ) {
    accessToken
    refreshToken
    requiresTwoFactor
    user {
      id
      username
      email
      role
      isEmailVerified
      twoFactorEnabled
      guestAccessExpiresAt
      createdAt
      subscriptions {
        id
        status
        expiresAt
        service {
          id
          name
          description
          price
          allowedAlgorithms
          rateLimit
          ratePeriod
          isActive
          createdAt
        }
      }
    }
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "login": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1Nia...",
      "requiresTwoFactor": false,
      "user": {
        "id": "cmhdva6yy0000tl2hyfq3j3ar",
        "username": "ownerUser",
        "email": "owner.user@email.com",
        "role": "GUEST",
        "isEmailVerified": true,
        "twoFactorEnabled": true,
        "guestAccessExpiresAt": null,
        "createdAt": "2025-10-30T20:18:33.803Z",
        "subscriptions": []
      }
    }
  }
}
```

> 💡 **Tip**: Enter the 6-digit code from your authenticator app as `twoFactorCode`

---

### Query 9: Disable 2FA

**Mutation Template:**

```graphql
mutation Disable2FA($password: String!, $token: String!) {
  disable2FA(password: $password, token: $token) {
    success
    message
  }
}
```

**Example Usage:**

```graphql
mutation Disable2FA {
  disable2FA(password: "SecurePass123!@#", token: "935974") {
    success
    message
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "disable2FA": {
      "success": true,
      "message": "2FA disabled successfully"
    }
  }
}
```

---

### Query 10: Generate New Backup Codes

**Mutation Template:**

```graphql
mutation GenerateBackupCodes($password: String!) {
  generateBackupCodes(password: $password) {
    success
    message
    backupCodes
    warning
  }
}
```

**Example Usage:**

```graphql
mutation GenerateBackupCodes {
  generateBackupCodes(password: "SecurePass123!") {
    success
    message
    backupCodes
    warning
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "generateBackupCodes": {
      "success": true,
      "message": "New backup codes generated",
      "backupCodes": [
        "X1Y2Z3A4",
        "B5C6D7E8",
        "F9G0H1I2",
        "J3K4L5M6",
        "N7O8P9Q0"
      ],
      "warning": "Save these backup codes in a safe place."
    }
  }
}
```

> ⚠️ **Note**: Old backup codes are invalidated when new ones are generated

---

### Query 11: Get Available Services

**Query:**

```graphql
query GetServices {
  services {
    id
    name
    description
    price
    allowedAlgorithms
    rateLimit
    ratePeriod
    isActive
    createdAt
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "services": [
      {
        "id": "cmhduojuh0004tlxc3tggg2xj",
        "name": "Enterprise Plan",
        "description": "Full access to all algorithms with highest rate limits",
        "price": 99.99,
        "allowedAlgorithms": [
          "dataAnalysis",
          "textAnalysis",
          "mlPrediction",
          "sentimentAnalysis",
          "timeSeriesAnalysis",
          "recommendation",
          "linearRegression"
        ],
        "rateLimit": 5000,
        "ratePeriod": 3600,
        "isActive": true,
        "createdAt": "2025-10-30T20:01:44.057Z"
      },
      {
        "id": "cmhduojug0003tlxcmw79jdvy",
        "name": "Pro Plan",
        "description": "Access to advanced ML and analysis algorithms",
        "price": 29.99,
        "allowedAlgorithms": [
          "dataAnalysis",
          "textAnalysis",
          "mlPrediction",
          "sentimentAnalysis",
          "timeSeriesAnalysis"
        ],
        "rateLimit": 500,
        "ratePeriod": 3600,
        "isActive": true,
        "createdAt": "2025-10-30T20:01:44.056Z"
      },
      {
        "id": "cmhduojuf0002tlxcxlus79jz",
        "name": "Basic Plan",
        "description": "Access to basic algorithms with standard rate limits",
        "price": 9.99,
        "allowedAlgorithms": ["dataAnalysis", "textAnalysis"],
        "rateLimit": 100,
        "ratePeriod": 3600,
        "isActive": true,
        "createdAt": "2025-10-30T20:01:44.055Z"
      },
      {
        "id": "cmhduoju60001tlxc0kjcrrp9",
        "name": "Guest Access",
        "description": "Limited access for guest users - renews every 5 hours",
        "price": 0,
        "allowedAlgorithms": ["dataAnalysis", "textAnalysis"],
        "rateLimit": 20,
        "ratePeriod": 3600,
        "isActive": true,
        "createdAt": "2025-10-30T20:01:44.047Z"
      }
    ]
  }
}
```

> 💡 **Note**: This endpoint is public - no authentication required

---

### Query 12: Get My Subscriptions

> 🔒 **Requires Authentication**

**Query:**

```graphql
query MySubscriptions {
  mySubscriptions {
    id
    status
    startDate
    expiresAt
    createdAt
    cancelledAt
    renewCount
    paymentMethod
    stripeSubscriptionId
    service {
      id
      name
      description
      price
      allowedAlgorithms
      rateLimit
      ratePeriod
      isActive
      createdAt
    }
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "mySubscriptions": []
  }
}
```

> 📝 **Note**: Returns empty array if user has no subscriptions

---

### Query 13: My Subscription History

> 🔒 **Requires Authentication**

**Query:**

```graphql
query MySubscriptionHistory {
  mySubscriptionHistory {
    total
    active
    cancelled
    expired
    subscriptions {
      id
      status
      startDate
      expiresAt
      cancelledAt
      renewCount
      paymentMethod
      service {
        id
        name
        price
      }
    }
  }
}
```

**Expected Output:**

```json
{
  "data": {
    "mySubscriptionHistory": {
      "total": 0,
      "active": 0,
      "cancelled": 0,
      "expired": 0,
      "subscriptions": []
    }
  }
}
```

---

## 📚 Quick Reference Guide

### Authentication Flow

```mermaid
graph LR
    A[Register] --> B[Verify Email]
    B --> C[Login]
    C --> D{2FA Enabled?}
    D -->|Yes| E[Enter 2FA Code]
    D -->|No| F[Access Granted]
    E --> F
```

### Token Lifetimes

| Token Type         | Lifetime   | Renewable            |
| ------------------ | ---------- | -------------------- |
| Access Token       | 15 minutes | ✅ via Refresh Token |
| Refresh Token      | 7 days     | ❌                   |
| Guest Access       | 5 hours    | ✅ Manual Renewal    |
| Email Verification | 24 hours   | ✅ Resend Available  |
| Trusted Device     | 7 days     | ❌                   |

### Common Response Codes

| Code | Meaning      | Action                 |
| ---- | ------------ | ---------------------- |
| 200  | Success      | Continue               |
| 400  | Bad Request  | Check input format     |
| 401  | Unauthorized | Login or refresh token |
| 403  | Forbidden    | Check permissions/role |
| 404  | Not Found    | Verify resource ID     |
| 500  | Server Error | Contact support        |

---

## 💡 Pro Tips

### 1. Testing Queries in GraphQL Playground

1. Open http://localhost:4000/graphql
2. Click "HTTP HEADERS" at bottom left
3. Add your access token:
   ```json
   {
     "Authorization": "Bearer your_access_token_here"
   }
   ```
4. Run your queries

### 2. Using Variables

Instead of hardcoding values, use variables:

```graphql
# Query with variables
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
  }
}

# Variables (in separate panel)
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Handling Errors

All mutations return `success` and `message` fields for easy error handling:

```javascript
const result = await graphqlClient.mutate(LOGIN_MUTATION);
if (result.data.login.success) {
  // Success
} else {
  console.error(result.data.login.message);
}
```

---

## 🔗 Related Resources

- **Main Documentation**: [README.md](./README.md)
- **GraphQL Playground**: http://localhost:4000/graphql
- **API Documentation**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/health

---

**Last Updated**: November 2025  
**Version**: 2.0.0
