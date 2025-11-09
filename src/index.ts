import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { config } from './config/env';
import { schema } from './api/graphql/schema';
import { createContext } from './types/context';
import { authRouter } from './api/auth/routes';
import { servicesRouter } from './api/services/routes';
import { apiKeysRouter } from './api/apiKeys/routes';
import { algorithmsRouter } from './api/algorithms/routes';
import { userManagementRouter } from './api/userManagement/routes';
import { stripeRouter } from './api/stripe/routes';
import { healthRouter } from './api/health/routes';
import { generalRateLimiter, authRateLimiter } from './middleware/rateLimiter';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/auth', authRateLimiter);
app.use('/api', generalRateLimiter);

// REST API routes
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/api-keys', apiKeysRouter);
app.use('/api/algorithms', algorithmsRouter);
app.use('/api/users', userManagementRouter);
app.use('/api/stripe', stripeRouter);

// GraphQL server setup
const startApolloServer = async () => {
  const apolloServer = new ApolloServer({
    schema,
    introspection: config.NODE_ENV !== 'production',
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: createContext,
    })
  );

  // Swagger docs (dev only)
  if (config.NODE_ENV === 'development') {
    const swaggerUi = await import('swagger-ui-express');
    const swaggerJsdoc = await import('swagger-jsdoc');
    
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'SaaS Backend API',
          version: '1.0.0',
          description: 'Enterprise-level SaaS backend with RBAC, 2FA, and Stripe',
        },
        servers: [{ url: config.API_URL }],
      },
      apis: ['./src/api/**/*.ts'],
    };

    const specs = swaggerJsdoc.default(swaggerOptions);
    app.use('/docs', swaggerUi.default.serve, swaggerUi.default.setup(specs));
  }

  // Error handling
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  // Start server
  app.listen(config.PORT, () => {
    console.log(`🚀 Server ready at ${config.API_URL}`);
    console.log(`📊 GraphQL endpoint: ${config.API_URL}/graphql`);
    if (config.NODE_ENV === 'development') {
      console.log(`📚 API docs: ${config.API_URL}/docs`);
    }
    console.log(`💚 Health check: ${config.API_URL}/health`);
  });
};

startApolloServer().catch(console.error);