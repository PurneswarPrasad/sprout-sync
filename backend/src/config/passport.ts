import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
      callbackURL: process.env['OAUTH_CALLBACK_URL'] || 'http://localhost:3001/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails } = profile;
        
        if (!emails || emails.length === 0) {
          return done(new Error('No email found in Google profile'), false);
        }

        const email = emails[0]?.value || '';
        const avatarUrl = profile.photos?.[0]?.value;

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { googleId: id },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              googleId: id,
              email,
              name: displayName,
              avatarUrl: avatarUrl ?? null,
            },
          });
        } else {
          // Update user info if it has changed
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: displayName,
              avatarUrl: avatarUrl ?? null,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

