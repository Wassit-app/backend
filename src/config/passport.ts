import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
import config from './config';
import TokenService from '../service/jwt';
import { prisma } from '../config/prisma'


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    
    if (!email) {
      return done(new Error('No email found from Google profile'), undefined);
    }

    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true
      }
    });

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          username: email.split('@')[0], // Generate a username from email
          password: '', // Empty password for OAuth users
          fullName: profile.displayName || email.split('@')[0],
          isVerified: true,
          role: 'CUSTOMER',
          oauthProvider: 'google',
          oauthId: profile.id
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isVerified: true
        }
      });
    }

    // Generate tokens
    const tokens = {
      accessToken: TokenService.generateToken(user, "CUSTOMER"),
      refreshToken: TokenService.generateToken(user, "CUSTOMER", "7d"),
    };

    return done(null, { user, tokens });
  } catch (err) {
    console.error('Google authentication error:', err);
    return done(err instanceof Error ? err : new Error('Authentication failed'), undefined);
  }
}));

