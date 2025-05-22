import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { logger } from "../utils/logger";

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// JWT Strategy
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET || "your-secret-key"
        },
        async (payload, done) => {
            try {
                const userRepository = AppDataSource.getRepository(User);
                const user = await userRepository.findOne({ where: { id: payload.id } });

                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (error) {
                logger.error(`JWT Strategy error: ${error}`);
                return done(error, false);
            }
        }
    )
);

// Local Strategy
passport.use(
    new LocalStrategy(
        {
            usernameField: "username",
            passwordField: "password"
        },
        async (username, password, done) => {
            try {
                const userRepository = AppDataSource.getRepository(User);
                const user = await userRepository.findOne({ where: { username } });

                if (!user) {
                    return done(null, false, { message: "Invalid credentials" });
                }

                const isValid = await user.comparePassword(password);
                if (!isValid) {
                    return done(null, false, { message: "Invalid credentials" });
                }

                return done(null, user);
            } catch (error) {
                logger.error(`Local Strategy error: ${error}`);
                return done(error);
            }
        }
    )
);

// Authentication middleware
export const isAuthenticated = passport.authenticate("jwt", { session: false }); 