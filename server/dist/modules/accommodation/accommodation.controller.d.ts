import { Request, Response, NextFunction } from "express";
export declare class AccommodationController {
    grant(req: Request, res: Response, next: NextFunction): Promise<void>;
    revoke(req: Request, res: Response, next: NextFunction): Promise<void>;
    modify(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCandidateAccommodations(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAuditTrail(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const accommodationController: AccommodationController;
//# sourceMappingURL=accommodation.controller.d.ts.map