import { Router } from "express";
import OrdersController from "../../../../controllers/app/private/customer/orders.controller";

const router = Router();


router.post("/orders", OrdersController.createOrder);




export default router;


