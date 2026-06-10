import { Request, Response, NextFunction } from 'express';

export const asyncHandler =
  <
    P = any,
    ResBody = any,
    ReqBody = any,
    ReqQuery = any,
    Locals extends Record<string, any> = Record<string, any>,
  >(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response<ResBody, Locals>,
      next: NextFunction
    ) => Promise<any>
  ) =>
  (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody, Locals>,
    next: NextFunction
  ) =>
    fn(req, res, next).catch(next);
