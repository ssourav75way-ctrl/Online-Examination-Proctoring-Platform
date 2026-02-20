import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";
import { sendSuccess } from "../../utils/response.util";
import { BadRequestError } from "../../utils/app-error";
import {
  parsePagination,
  calculateTotalPages,
} from "../../utils/pagination.util";
import { GlobalRole } from "@prisma/client";

export class UserController {
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await userService.getById(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await userService.getById(req.params.id as string);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(
        req.query as { page?: string; limit?: string },
      );
      const role = req.query.role as GlobalRole | undefined;
      const { users, total } = await userService.getAll(pagination, role);
      sendSuccess(res, users, "Users retrieved", 200, {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: calculateTotalPages(total, pagination.limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async findByEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const email = req.query.email as string;
      if (!email) throw new BadRequestError("Email is required");
      const user = await userService.findByEmail(email);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await userService.update(req.user!.userId, req.body);
      sendSuccess(res, user, "Profile updated");
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await userService.deactivate(req.params.id as string);
      sendSuccess(res, null, "User deactivated");
    } catch (error) {
      next(error);
    }
  }

  async activate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await userService.activate(req.params.id as string);
      sendSuccess(res, null, "User activated");
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
