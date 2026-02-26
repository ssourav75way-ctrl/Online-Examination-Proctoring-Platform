"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.param = void 0;
const param = (value) => {
    if (Array.isArray(value))
        return value[0] || "";
    return value || "";
};
exports.param = param;
//# sourceMappingURL=param.util.js.map