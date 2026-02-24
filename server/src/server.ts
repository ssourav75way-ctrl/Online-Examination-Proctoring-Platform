import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import prisma from "./config/database.config";
import { appConfig } from "./config";

const startServer = async (): Promise<void> => {
  try {

    await prisma.$connect();
    console.log(" Database connected successfully");


    app.listen(appConfig.port, () => {
      console.log(
        ` Server running on port ${appConfig.port} in ${appConfig.nodeEnv} mode`,
      );
      console.log(
        ` Health check: http://localhost:${appConfig.port}/api/health`,
      );
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};


const shutdown = async (): Promise<void> => {
  console.log("\n Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer();
