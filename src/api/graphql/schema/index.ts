import { makeExecutableSchema } from '@graphql-tools/schema';
import { authResolvers } from '../resolvers/auth';
import { userResolvers } from '../resolvers/user';
import { serviceResolvers } from '../resolvers/service';
import { subscriptionResolvers } from '../resolvers/subscription';
import { apiKeyResolvers } from '../resolvers/apiKey';
import { algorithmResolvers } from '../resolvers/algorithm';

const typeDefs = `
  scalar DateTime
  
  type Query {
    me: User
    services: [Service!]!
    mySubscriptions: [Subscription!]!
    mySubscriptionHistory: SubscriptionHistory!
    myApiKeys: [ApiKey!]!
    users: [User!]!
    user(id: ID!): User
  }
  
  type Mutation {
    # Authentication
    register(username: String!, email: String!, password: String!): AuthResponse!
    verifyEmail(token: String!): AuthResponse!
    resendVerification(email: String!): AuthResponse!
    login(email: String!, password: String!, twoFactorCode: String, deviceToken: String, rememberDevice: Boolean): LoginResponse!
    logout: Boolean!
    refreshToken(refreshToken: String!): LoginResponse!
    
    # Two-Factor Authentication
    setup2FA: TwoFactorSetup!
    enable2FA(token: String!): TwoFactorEnableResponse!
    disable2FA(password: String!, token: String!): AuthResponse!
    generateBackupCodes(password: String!): BackupCodesResponse!
    
    # Subscriptions
    subscribeToService(serviceId: ID!): Subscription!
    cancelSubscription(subscriptionId: ID!): Subscription!
    
    # API Keys
    createApiKey(name: String!): ApiKeyCreated!
    revokeApiKey(keyId: ID!): Boolean!
    deleteApiKey(keyId: ID!): Boolean!
    
    # User Management (Admin/Owner)
    updateUserRole(userId: ID!, role: String!): User!
    deleteUser(userId: ID!): Boolean!
    
    # Guest
    renewGuestAccess: GuestRenewalResponse!
    
    # Algorithms
    executeAlgorithm(algorithmName: String!, data: JSON!): AlgorithmExecutionResult!
  }
  
  scalar JSON
  
  enum Role {
    OWNER
    ADMIN
    MAINTAINER
    SUBSCRIBED_USER
    GUEST
  }
  
  enum SubscriptionStatus {
    ACTIVE
    CANCELLED
    EXPIRED
    PENDING
  }
  
  type User {
    id: ID!
    username: String!
    email: String!
    role: Role!
    isEmailVerified: Boolean!
    twoFactorEnabled: Boolean!
    guestAccessExpiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLoginAt: DateTime
    subscriptions: [Subscription!]!
    apiKeys: [ApiKey!]!
  }
  
  type Service {
    id: ID!
    name: String!
    description: String!
    price: Float!
    allowedAlgorithms: [String!]!
    rateLimit: Int!
    ratePeriod: Int!
    isActive: Boolean!
    createdAt: DateTime!
  }
  
  type Subscription {
    id: ID!
    userId: ID!
    serviceId: ID!
    status: SubscriptionStatus!
    startDate: DateTime!
    expiresAt: DateTime
    cancelledAt: DateTime
    renewCount: Int!
    paymentMethod: String
    stripeSubscriptionId: String
    createdAt: DateTime!
    service: Service!
    user: User!
  }
  
  type SubscriptionHistory {
    total: Int!
    active: Int!
    cancelled: Int!
    expired: Int!
    subscriptions: [Subscription!]!
  }
  
  type ApiKey {
    id: ID!
    userId: ID!
    name: String!
    keyPrefix: String!
    lastUsedAt: DateTime
    usageCount: Int!
    expiresAt: DateTime
    isRevoked: Boolean!
    createdAt: DateTime!
  }
  
  type ApiKeyCreated {
    id: ID!
    name: String!
    key: String!
    keyPrefix: String!
    createdAt: DateTime!
    warning: String!
  }
  
  type AuthResponse {
    success: Boolean!
    message: String!
  }
  
  type LoginResponse {
    accessToken: String
    refreshToken: String
    requiresTwoFactor: Boolean
    deviceToken: String
    user: User
  }
  
  type TwoFactorSetup {
    secret: String!
    qrCode: String!
    message: String!
  }
  
  type TwoFactorEnableResponse {
    success: Boolean!
    message: String!
    backupCodes: [String!]!
    warning: String!
  }
  
  type BackupCodesResponse {
    success: Boolean!
    message: String!
    backupCodes: [String!]!
    warning: String!
  }
  
  type GuestRenewalResponse {
    success: Boolean!
    message: String!
    expiresAt: DateTime
  }
  
  type AlgorithmExecutionResult {
    success: Boolean!
    result: JSON
    error: String
    executionTime: Int
  }
`;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {
      ...userResolvers.Query,
      ...serviceResolvers.Query,
      ...subscriptionResolvers.Query,
      ...apiKeyResolvers.Query,
    },
    Mutation: {
      ...authResolvers.Mutation,
      ...subscriptionResolvers.Mutation,
      ...apiKeyResolvers.Mutation,
      ...userResolvers.Mutation,
      ...algorithmResolvers.Mutation,
    },
  },
});