"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokenPair = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const generateTokenPair = (payload) => {
    const accessOptions = {
        expiresIn: config_1.jwtConfig.expiresIn,
    };
    const accessToken = jsonwebtoken_1.default.sign({ ...payload }, config_1.jwtConfig.secret, accessOptions);
    const refreshPayload = {
        userId: payload.userId,
        type: "refresh",
    };
    const refreshOptions = {
        expiresIn: config_1.jwtConfig.refreshExpiresIn,
    };
    const refreshToken = jsonwebtoken_1.default.sign({ ...refreshPayload }, config_1.jwtConfig.refreshSecret, refreshOptions);
    return { accessToken, refreshToken };
};
exports.generateTokenPair = generateTokenPair;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.jwtConfig.secret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.jwtConfig.refreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=token.util.js.map