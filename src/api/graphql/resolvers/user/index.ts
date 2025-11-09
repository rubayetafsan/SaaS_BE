import { Context } from '../../../../types/context';
import { GUEST_ACCESS_DURATION } from '../../../../config/services.config';
import { canManageUser, canChangeRole } from '../../../../middleware/roleAuth';

export const userResolvers = {
  Query: {
    // Get current authenticated user
    me: async (_: any, __: any, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { service: true },
          },
          apiKeys: {
            where: { isRevoked: false },
          },
        },
      });
      
      if (!dbUser) throw new Error('User not found');
      
      // Parse allowedAlgorithms JSON in services
      const parsedUser = {
        ...dbUser,
        subscriptions: dbUser.subscriptions.map((sub: any) => ({
          ...sub,
          service: {
            ...sub.service,
            allowedAlgorithms: JSON.parse(sub.service.allowedAlgorithms),
          },
        })),
      };
      
      return parsedUser;
    },
    
    // List all users (Admin/Owner only)
    users: async (_: any, __: any, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      
      // Only OWNER and ADMIN can list all users
      if (!['OWNER', 'ADMIN'].includes(user.role)) {
        throw new Error('Insufficient permissions. Only Owners and Admins can list all users.');
      }
      
      const users = await prisma.user.findMany({
        include: {
          subscriptions: {
            include: { service: true },
          },
          apiKeys: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Parse allowedAlgorithms JSON
      return users.map((u: any) => ({
        ...u,
        subscriptions: u.subscriptions.map((sub: any) => ({
          ...sub,
          service: {
            ...sub.service,
            allowedAlgorithms: JSON.parse(sub.service.allowedAlgorithms),
          },
        })),
      }));
    },
    
    // Get specific user by ID
    user: async (_: any, { id }: { id: string }, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      
      // Users can view their own profile
      if (user.id === id) {
        const dbUser = await prisma.user.findUnique({
          where: { id },
          include: {
            subscriptions: { include: { service: true } },
            apiKeys: true,
          },
        });
        
        if (!dbUser) throw new Error('User not found');
        
        return {
          ...dbUser,
          subscriptions: dbUser.subscriptions.map((sub: any) => ({
            ...sub,
            service: {
              ...sub.service,
              allowedAlgorithms: JSON.parse(sub.service.allowedAlgorithms),
            },
          })),
        };
      }
      
      // Admin/Owner can view any user
      if (!['OWNER', 'ADMIN'].includes(user.role)) {
        throw new Error('Insufficient permissions. You can only view your own profile.');
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { id },
        include: {
          subscriptions: { include: { service: true } },
          apiKeys: true,
        },
      });
      
      if (!dbUser) throw new Error('User not found');
      
      return {
        ...dbUser,
        subscriptions: dbUser.subscriptions.map((sub: any) => ({
          ...sub,
          service: {
            ...sub.service,
            allowedAlgorithms: JSON.parse(sub.service.allowedAlgorithms),
          },
        })),
      };
    },
  },
  
  Mutation: {
    // Update user role (Admin/Owner only)
    updateUserRole: async (
      _: any,
      { userId, role }: { userId: string; role: string },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      // Validate role
      const validRoles = ['OWNER', 'ADMIN', 'MAINTAINER', 'SUBSCRIBED_USER', 'GUEST'];
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
      }
      
      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!targetUser) throw new Error('User not found');
      
      // Prevent self-role change
      if (user.id === userId) {
        throw new Error('You cannot change your own role. Ask another administrator for help.');
      }
      
      // Check if manager can change this role
      if (!canChangeRole(user.role, targetUser.role, role)) {
        if (role === 'OWNER') {
          throw new Error('Only the current OWNER can assign the OWNER role to another user.');
        }
        throw new Error('Insufficient permissions to change this user\'s role.');
      }
      
      // Update role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
        include: {
          subscriptions: { include: { service: true } },
          apiKeys: true,
        },
      });
      
      return {
        ...updatedUser,
        subscriptions: updatedUser.subscriptions.map((sub: any) => ({
          ...sub,
          service: {
            ...sub.service,
            allowedAlgorithms: JSON.parse(sub.service.allowedAlgorithms),
          },
        })),
      };
    },
    
    // Delete user (Admin/Owner only)
    deleteUser: async (
      _: any,
      { userId }: { userId: string },
      { user, prisma }: Context
    ) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!targetUser) throw new Error('User not found');
      
      // Prevent self-deletion
      if (user.id === userId) {
        throw new Error('You cannot delete your own account. Contact another administrator if you want to delete your account.');
      }
      
      // Check if manager can delete this user
      if (!canManageUser(user.role, targetUser.role)) {
        throw new Error('Insufficient permissions to delete this user. Only Owners can delete Admins, and Admins can delete lower-tier users.');
      }
      
      // Prevent deleting the last OWNER
      if (targetUser.role === 'OWNER') {
        const ownerCount = await prisma.user.count({
          where: { role: 'OWNER' },
        });
        
        if (ownerCount <= 1) {
          throw new Error('Cannot delete the last OWNER account. Promote another user to OWNER first.');
        }
      }
      
      // Delete user (cascade delete will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });
      
      return true;
    },
    
    // Renew guest access (Guest users only)
    renewGuestAccess: async (_: any, __: any, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      
      // Only guests can renew
      if (user.role !== 'GUEST') {
        throw new Error('Only guest users can renew access. You are currently a ' + user.role + '. Consider subscribing for unlimited access.');
      }
      
      // Calculate new expiration (5 hours from now)
      const expiresAt = new Date(Date.now() + GUEST_ACCESS_DURATION);
      
      // Update expiration
      await prisma.user.update({
        where: { id: user.id },
        data: { guestAccessExpiresAt: expiresAt },
      });
      
      return {
        success: true,
        message: 'Guest access renewed for 5 more hours. Consider subscribing for unlimited access!',
        expiresAt,
      };
    },
  },
};