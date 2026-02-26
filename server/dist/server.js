"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_config_1 = __importDefault(require("./config/database.config"));
const config_1 = require("./config");
const startServer = async () => {
    try {
        await database_config_1.default.$connect();
        console.log(" Database connected successfully");
        app_1.default.listen(config_1.appConfig.port, () => {
            console.log(` Server running on port ${config_1.appConfig.port} in ${config_1.appConfig.nodeEnv} mode`);
        });
    }
    catch (error) {
        console.error(" Failed to start server:", error);
        await database_config_1.default.$disconnect();
        process.exit(1);
    }
};
const shutdown = async () => {
    console.log("\n Shutting down gracefully...");
    await database_config_1.default.$disconnect();
    process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
startServer();
//# sourceMappingURL=server.js.map