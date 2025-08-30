import { Router } from 'express';
import passport from 'passport';
import { generateToken } from '../utils/jwt';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = Router();

// GET /auth/google - Initiate Google OAuth
router.get('/google', (req, res, next) => {
  console.log('🔐 Initiating Google OAuth...');
  console.log('Environment:', process.env['NODE_ENV']);
  console.log('Google Client ID:', process.env['GOOGLE_CLIENT_ID'] ? 'Set' : 'Missing');
  console.log('Google Client Secret:', process.env['GOOGLE_CLIENT_SECRET'] ? 'Set' : 'Missing');
  console.log('Callback URL:', process.env['OAUTH_CALLBACK_URL']);
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent',
    session: false // Disable session requirement
  })(req, res, next);
});

// GET /auth/google/callback - Google OAuth callback with JWT
router.get('/google/callback', 
  (req, res, next) => {
    console.log('🔄 Google OAuth callback received');
    console.log('Query params:', req.query);
    
    passport.authenticate('google', { 
      failureRedirect: process.env['FRONTEND_URL'] || 'http://localhost:5173',
      failureMessage: true,
      session: false, // Disable session requirement
    })(req, res, next);
  },
  (req, res) => {
    console.log('✅ OAuth successful');
    console.log('User:', req.user);
    
    if (!req.user) {
      console.log('❌ No user found after OAuth');
      return res.redirect(`${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/auth-error`);
    }

    // Generate JWT token
    const user = req.user as any;
    const token = generateToken({
      userId: user.id,
      id: user.id, // Add id for backward compatibility
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || undefined,
    });

    console.log('🎫 JWT token generated');

    // Redirect to frontend with token
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth-callback?token=${encodeURIComponent(token)}`;
    
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  }
);

// GET /auth/profile - Get current user profile (JWT protected)
router.get('/profile', authenticateJWT, (req, res) => {
  res.json({
    success: true,
          data: {
        id: (req.user as any).userId,
        email: (req.user as any).email,
        name: (req.user as any).name,
        avatarUrl: (req.user as any).avatarUrl,
      },
  });
});

// POST /auth/logout - Logout user (JWT - just return success)
router.post('/logout', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /auth/status - Check authentication status (JWT)
router.get('/status', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    user: {
      id: (req.user as any).userId,
      email: (req.user as any).email,
      name: (req.user as any).name,
      avatarUrl: (req.user as any).avatarUrl,
    },
  });
});

// GET /auth/status (without auth - for checking if user is logged in)
router.get('/status/public', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.json({
      success: true,
      authenticated: false,
      user: null,
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        avatarUrl: decoded.avatarUrl,
      },
    });
  } catch (error) {
    res.json({
      success: true,
      authenticated: false,
      user: null,
    });
  }
});

export { router as authRouter };

