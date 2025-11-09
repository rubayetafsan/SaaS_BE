import { Context } from '../../../../types/context';
import { hashPassword, comparePassword, validatePassword } from '../../../../utils/password';
import { encrypt, generateToken } from '../../../../utils/encryption';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../../utils/jwt';
import {
  generate2FASecret,
  generate2FAQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  removeBackupCode,
} from '../../../../services/twoFactorService';
import {
  sendVerificationEmail,
  send2FAEnabledEmail,
} from '../../../../services/emailService';

export const authResolvers = {
  Mutation: {
    register: async (
      _: any,
      { username, email, password }: { username: string; email: string; password: string },
      { prisma }: Context
    ) => {
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }
      
      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });
      
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }
      
      // Hash password and encrypt email
      const hashedPassword = await hashPassword(password);
      const encryptedEmail = encrypt(email);
      const verificationToken = generateToken();
      
      // Create user
      await prisma.user.create({
        data: {
          username,
          email,
          encryptedEmail,
          password: hashedPassword,
          role: 'GUEST',
          emailVerificationToken: verificationToken,
        },
      });
      
      // Send verification email
      try {
        await sendVerificationEmail(email, username, verificationToken);
      } catch (error) {
        console.error('Failed to send verification email:', error);
      }
      
      return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
      };
    },
    
    verifyEmail: async (
      _: any,
      { token }: { token: string },
      { prisma }: Context
    ) => {
      const user = await prisma.user.findFirst({
        where: { emailVerificationToken: token },
      });
      
      if (!user) {
        throw new Error('Invalid or expired verification token');
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
        },
      });
      
      return {
        success: true,
        message: 'Email verified successfully! You can now log in.',
      };
    },
    
    resendVerification: async (
      _: any,
      { email }: { email: string },
      { prisma }: Context
    ) => {
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }
      
      const verificationToken = generateToken();
      
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: verificationToken },
      });
      
      await sendVerificationEmail(email, user.username, verificationToken);
      
      return {
        success: true,
        message: 'Verification email sent successfully',
      };
    },
    
    login: async (
      _: any,
      {
        email,
        password,
        twoFactorCode,
        deviceToken,
        rememberDevice,
      }: {
        email: string;
        password: string;
        twoFactorCode?: string;
        deviceToken?: string;
        rememberDevice?: boolean;
      },
      { prisma }: Context
    ) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { subscriptions: { include: { service: true } } },
      });
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check password
      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid credentials');
      }
      
      if (!user.isEmailVerified) {
        throw new Error('Please verify your email before logging in');
      }
      
      // Handle 2FA
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // Check trusted device
        if (deviceToken) {
          const trustedDevice = await prisma.trustedDevice.findFirst({
            where: {
              userId: user.id,
              deviceToken,
              expiresAt: { gte: new Date() },
            },
          });
          
          if (trustedDevice) {
            // Update last used
            await prisma.trustedDevice.update({
              where: { id: trustedDevice.id },
              data: { lastUsedAt: new Date() },
            });
            
            // Skip 2FA
            const accessToken = generateAccessToken({
              userId: user.id,
              email: user.email,
              role: user.role,
            });
            const refreshToken = generateRefreshToken({
              userId: user.id,
              email: user.email,
              role: user.role,
            });
            
            return {
              accessToken,
              refreshToken,
              requiresTwoFactor: false,
              user,
            };
          }
        }
        
        // Require 2FA code
        if (!twoFactorCode) {
          return {
            requiresTwoFactor: true,
          };
        }
        
        // Verify 2FA token or backup code
        let isValid = verify2FAToken(twoFactorCode, user.twoFactorSecret);
        
        if (!isValid && user.backupCodes) {
          // Try backup code
          const hashedCodes = JSON.parse(user.backupCodes);
          const codeIndex = verifyBackupCode(twoFactorCode, hashedCodes);
          
          if (codeIndex !== -1) {
            isValid = true;
            // Remove used backup code
            const newCodes = removeBackupCode(hashedCodes, codeIndex);
            await prisma.user.update({
              where: { id: user.id },
              data: { backupCodes: JSON.stringify(newCodes) },
            });
          }
        }
        
        if (!isValid) {
          throw new Error('Invalid 2FA code');
        }
        
        // Create trusted device if requested
        let newDeviceToken: string | undefined;
        if (rememberDevice) {
          newDeviceToken = generateToken();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
          
          await prisma.trustedDevice.create({
            data: {
              userId: user.id,
              deviceToken: newDeviceToken,
              deviceFingerprint: 'web',
              expiresAt,
            },
          });
        }
        
        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });
        const refreshToken = generateRefreshToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });
        
        return {
          accessToken,
          refreshToken,
          requiresTwoFactor: false,
          deviceToken: newDeviceToken,
          user,
        };
      }
      
      // No 2FA - generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      
      return {
        accessToken,
        refreshToken,
        requiresTwoFactor: false,
        user,
      };
    },
    
    logout: async (_: any, __: any, { user }: Context) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      // In a real app, you'd invalidate the token here
      return true;
    },
    
    refreshToken: async (
      _: any,
      { refreshToken }: { refreshToken: string },
      { prisma }: Context
    ) => {
      const payload = verifyRefreshToken(refreshToken);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { subscriptions: { include: { service: true } } },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      return {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      };
    },
    
    setup2FA: async (_: any, __: any, { user, prisma }: Context) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (!dbUser) {
        throw new Error('User not found');
      }
      
      if (dbUser.twoFactorEnabled) {
        throw new Error('2FA is already enabled');
      }
      
      const secret = generate2FASecret();
      const qrCode = await generate2FAQRCode(dbUser.email, secret);
      
      // Store secret temporarily (not enabled yet)
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
      });
      
      return {
        secret,
        qrCode,
        message: 'Scan the QR code with your authenticator app',
      };
    },
    
    enable2FA: async (
      _: any,
      { token }: { token: string },
      { user, prisma }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (!dbUser || !dbUser.twoFactorSecret) {
        throw new Error('Please setup 2FA first');
      }
      
      if (dbUser.twoFactorEnabled) {
        throw new Error('2FA is already enabled');
      }
      
      // Verify token
      const isValid = verify2FAToken(token, dbUser.twoFactorSecret);
      if (!isValid) {
        throw new Error('Invalid 2FA code');
      }
      
      // Generate backup codes
      const codes = generateBackupCodes();
      const hashedCodes = hashBackupCodes(codes);
      
      // Enable 2FA
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          backupCodes: JSON.stringify(hashedCodes),
        },
      });
      
      // Send confirmation email
      try {
        await send2FAEnabledEmail(dbUser.email, dbUser.username);
      } catch (error) {
        console.error('Failed to send 2FA email:', error);
      }
      
      return {
        success: true,
        message: '2FA enabled successfully',
        backupCodes: codes,
        warning: 'Save these backup codes in a safe place. They can only be used once.',
      };
    },
    
    disable2FA: async (
      _: any,
      { password, token }: { password: string; token: string },
      { user, prisma }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (!dbUser) {
        throw new Error('User not found');
      }
      
      // Verify password
      const validPassword = await comparePassword(password, dbUser.password);
      if (!validPassword) {
        throw new Error('Invalid password');
      }
      
      // Verify 2FA token
      if (dbUser.twoFactorSecret) {
        const isValid = verify2FAToken(token, dbUser.twoFactorSecret);
        if (!isValid) {
          throw new Error('Invalid 2FA code');
        }
      }
      
      // Disable 2FA
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: null,
        },
      });
      
      // Remove all trusted devices
      await prisma.trustedDevice.deleteMany({
        where: { userId: user.id },
      });
      
      return {
        success: true,
        message: '2FA disabled successfully',
      };
    },
    
    generateBackupCodes: async (
      _: any,
      { password }: { password: string },
      { user, prisma }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      
      if (!dbUser) {
        throw new Error('User not found');
      }
      
      // Verify password
      const validPassword = await comparePassword(password, dbUser.password);
      if (!validPassword) {
        throw new Error('Invalid password');
      }
      
      if (!dbUser.twoFactorEnabled) {
        throw new Error('2FA is not enabled');
      }
      
      // Generate new backup codes
      const codes = generateBackupCodes();
      const hashedCodes = hashBackupCodes(codes);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { backupCodes: JSON.stringify(hashedCodes) },
      });
      
      return {
        success: true,
        message: 'New backup codes generated',
        backupCodes: codes,
        warning: 'Save these backup codes in a safe place.',
      };
    },
  },
};