"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalPages = exports.parsePagination = void 0;
const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.parsePagination = parsePagination;
const calculateTotalPages = (total, limit) => {
    return Math.ceil(total / limit);
};
exports.calculateTotalPages = calculateTotalPages;
//# sourceMappingURL=pagination.util.js.map