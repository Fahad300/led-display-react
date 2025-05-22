import { AppDataSource } from "./database";
import { User } from "../models/User";
import { logger } from "../utils/logger";

const DEFAULT_ADMIN = {
    username: "admin",
    password: "admin123"
};

export const initializeDatabase = async (): Promise<void> => {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        logger.info("Database connection initialized");

        // Check if admin user exists
        const userRepository = AppDataSource.getRepository(User);
        const adminExists = await userRepository.findOne({
            where: { username: DEFAULT_ADMIN.username }
        });

        if (!adminExists) {
            // Create admin user
            const adminUser = userRepository.create({
                username: DEFAULT_ADMIN.username,
                password: DEFAULT_ADMIN.password
            });

            await adminUser.hashPassword();
            await userRepository.save(adminUser);
            logger.info("Default admin user created");
        } else {
            logger.info("Admin user already exists");
        }

    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Database initialization error: ${error.message}`);
        }
        process.exit(1);
    }
}; 