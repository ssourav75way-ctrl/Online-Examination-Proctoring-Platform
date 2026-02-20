import { Response } from "express";
import { HTTP_STATUS, HttpStatusCode } from "../constants/http-status";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: HttpStatusCode = HTTP_STATUS.OK,
  meta?: PaginationMeta,
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: string[],
): void => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    errors,
  };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = "Created successfully",
): void => {
  sendSuccess(res, data, message, HTTP_STATUS.CREATED);
};

export const sendNoContent = (res: Response): void => {
  res.status(HTTP_STATUS.NO_CONTENT).send();
};
