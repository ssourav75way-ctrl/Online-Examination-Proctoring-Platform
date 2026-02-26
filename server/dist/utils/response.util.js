"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNoContent = exports.sendCreated = exports.sendError = exports.sendSuccess = void 0;
const http_status_1 = require("../constants/http-status");
const sendSuccess = (res, data, message = "Success", statusCode = http_status_1.HTTP_STATUS.OK, meta) => {
    const response = {
        success: true,
        message,
        data,
        meta,
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = http_status_1.HTTP_STATUS.INTERNAL_SERVER_ERROR, errors) => {
    const response = {
        success: false,
        message,
        errors,
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendCreated = (res, data, message = "Created successfully") => {
    (0, exports.sendSuccess)(res, data, message, http_status_1.HTTP_STATUS.CREATED);
};
exports.sendCreated = sendCreated;
const sendNoContent = (res) => {
    res.status(http_status_1.HTTP_STATUS.NO_CONTENT).send();
};
exports.sendNoContent = sendNoContent;
//# sourceMappingURL=response.util.js.map