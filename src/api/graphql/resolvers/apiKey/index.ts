import { Context } from '../../../../types/context';
import { generateApiKey } from '../../../../utils/apiKey';

export const apiKeyResolvers = {
  Query: {
    myApiKeys: async (_: any, __: any, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      
      return prisma.apiKey.findMany({
        where: {
          userId: user.id,
          isRevoked: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  },
  
  Mutation: {
    createApiKey: async (
      _: any,
      { name }: { name: string },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      // Validate name
      if (!name || name.trim().length === 0) {
        throw new Error('API key name is required');
      }
      
      if (name.length > 100) {
        throw new Error('API key name must be less than 100 characters');
      }
      
      // Guests cannot create API keys
      if (user.role === 'GUEST') {
        throw new Error('Guest users cannot create API keys. Please subscribe to a plan first to create API keys.');
      }
      
      // Check if user has active subscription (for non-admin users)
      if (!['OWNER', 'ADMIN', 'MAINTAINER'].includes(user.role)) {
        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            userId: user.id,
            status: 'ACTIVE',
          },
        });
        
        if (!activeSubscription) {
          throw new Error('You need an active subscription to create API keys. Please subscribe first.');
        }
      }
      
      // Check for duplicate name
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          userId: user.id,
          name,
          isRevoked: false,
        },
      });
      
      if (existingKey) {
        throw new Error('You already have an API key with this name. Please use a different name.');
      }
      
      // Generate API key
      const { key, keyHash, keyPrefix } = generateApiKey();
      
      // Create API key in database
      const apiKey = await prisma.apiKey.create({
        data: {
          userId: user.id,
          name: name.trim(),
          keyHash,
          keyPrefix,
        },
      });
      
      // Return the key (only time it's shown!)
      return {
        ...apiKey,
        key,
        warning: '⚠️ Save this API key now! You will not be able to see it again. Store it securely.',
      };
    },
    
    revokeApiKey: async (
      _: any,
      { keyId }: { keyId: string },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });
      
      if (!apiKey) {
        throw new Error('API key not found');
      }
      
      // Check permissions - users can revoke their own, admins/maintainers can revoke any
      if (apiKey.userId !== user.id && !['OWNER', 'ADMIN', 'MAINTAINER'].includes(user.role)) {
        throw new Error('Insufficient permissions to revoke this API key');
      }
      
      if (apiKey.isRevoked) {
        throw new Error('This API key is already revoked');
      }
      
      // Revoke the key
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { isRevoked: true },
      });
      
      return true;
    },
    
    deleteApiKey: async (
      _: any,
      { keyId }: { keyId: string },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
      });
      
      if (!apiKey) {
        throw new Error('API key not found');
      }
      
      // Check permissions
      if (apiKey.userId !== user.id && !['OWNER', 'ADMIN', 'MAINTAINER'].includes(user.role)) {
        throw new Error('Insufficient permissions to delete this API key');
      }
      
      // Delete the key permanently
      await prisma.apiKey.delete({
        where: { id: keyId },
      });
      
      return true;
    },
  },
};