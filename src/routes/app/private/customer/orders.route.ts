import { Router } from "express";
import OrdersController from "../../../../controllers/app/private/customer/orders.controller";

const   router = Router();


router.post("/orders", OrdersController.createOrder);
router.get("/orders/:id", OrdersController.getOrderById);
router.delete("/orders/:id", OrdersController.deleteOrder);
router.get("/orders/customer/:customerId", OrdersController.getOrdersForCustomer);
router.put("/location", OrdersController.updateCustomerLocation);





export default router;


