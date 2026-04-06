import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          issues: error.flatten(),
        });
      }

      return res.status(500).json({ error: "Unexpected validation error" });
    }
  };
}
