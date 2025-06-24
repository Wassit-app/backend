import logger from "../utils/logger";
import { Request, Response, NextFunction } from "express";


export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("error :",err.error);

    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
    })
}