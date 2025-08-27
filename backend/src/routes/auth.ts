import { Router } from 'express';
import passport from 'passport';
import { isAuthenticated, isNotAuthenticated } from '../middleware/auth';

const router = Router();

// GET /auth/google - Initiate Google OAuth
router.get('/google', isNotAuthenticated, passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// GET /auth/google/callback - Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    failureMessage: true,
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend home page
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/home`);
  }
);

// GET /auth/profile - Get current user profile
router.get('/profile', isAuthenticated, (req, res) => {
  const user = req.user as any;
  
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  });
});

// POST /auth/logout - Logout user
router.post('/logout', isAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

// GET /auth/status - Check authentication status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: (req.user as any).id,
      email: (req.user as any).email,
      name: (req.user as any).name,
      avatarUrl: (req.user as any).avatarUrl,
    } : null,
  });
});

export { router as authRouter };

