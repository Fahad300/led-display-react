import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import passport from "passport";
import { AppDataSource } from "./database";
import { User } from "../models/User";
import { logger } from "../utils/logger";

export const initializePassport = (): void => {
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
                    logger.error(`Local strategy error: ${error}`);
                    return done(error);
                }
            }
        )
    );

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
                    logger.error(`JWT strategy error: ${error}`);
                    return done(error, false);
                }
            }
        )
    );
}; 