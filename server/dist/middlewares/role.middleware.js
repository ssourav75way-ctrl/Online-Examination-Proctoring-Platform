"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireInstitutionRole = exports.requireGlobalRole = void 0;
const app_error_1 = require("../utils/app-error");
const requireGlobalRole = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next(new app_error_1.UnauthorizedError("Authentication required"));
            return;
        }
        if (!allowedRoles.includes(req.user.globalRole)) {
            next(new app_error_1.ForbiddenError("Insufficient permissions"));
            return;
        }
        next();
    };
};
exports.requireGlobalRole = requireGlobalRole;
const requireInstitutionRole = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.scopedUser) {
            next(new app_error_1.ForbiddenError("Institution context required"));
            return;
        }
        if (!allowedRoles.includes(req.scopedUser.institutionRole)) {
            next(new app_error_1.ForbiddenError("Insufficient institution permissions"));
            return;
        }
        next();
    };
};
exports.requireInstitutionRole = requireInstitutionRole;
const requireAnyRole = (globalRoles, institutionRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            next(new app_error_1.UnauthorizedError("Authentication required"));
            return;
        }
        const hasGlobalRole = globalRoles.includes(req.user.globalRole);
        const hasInstitutionRole = req.scopedUser &&
            institutionRoles.includes(req.scopedUser.institutionRole);
        if (!hasGlobalRole && !hasInstitutionRole) {
            next(new app_error_1.ForbiddenError("Insufficient permissions"));
            return;
        }
        next();
    };
};
exports.requireAnyRole = requireAnyRole;
//# sourceMappingURL=role.middleware.js.map