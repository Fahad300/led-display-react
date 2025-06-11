"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePassport = void 0;
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const passport_1 = __importDefault(require("passport"));
const database_1 = require("./database");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const initializePassport = () => {
    // Local Strategy
    passport_1.default.use(new passport_local_1.Strategy({
        usernameField: "username",
        passwordField: "password"
    }, async (username, password, done) => {
        try {
            const userRepository = database_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepository.findOne({ where: { username } });
            if (!user) {
                return done(null, false, { message: "Invalid credentials" });
            }
            const isValid = await user.comparePassword(password);
            if (!isValid) {
                return done(null, false, { message: "Invalid credentials" });
            }
            return done(null, user);
        }
        catch (error) {
            logger_1.logger.error(`Local strategy error: ${error}`);
            return done(error);
        }
    }));
    // JWT Strategy
    passport_1.default.use(new passport_jwt_1.Strategy({
        jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET || "your-secret-key"
    }, async (payload, done) => {
        try {
            const userRepository = database_1.AppDataSource.getRepository(User_1.User);
            const user = await userRepository.findOne({ where: { id: payload.id } });
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        }
        catch (error) {
            logger_1.logger.error(`JWT strategy error: ${error}`);
            return done(error, false);
        }
    }));
};
exports.initializePassport = initializePassport;
