// import AdminRouter from "./admin/index";
import AppRouter from "./app/index";
import { Router } from "express";

const router = Router();

router.use("/app", AppRouter);
// router.use("/dashboard", AdminRouter);

export default router;