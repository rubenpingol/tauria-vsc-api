import { Router } from "express";
import AuthController from "../controllers/AuthController";
import checkJWT from "../middlewares/checkJWT";

const router = Router();

// login route
router.post("/login", AuthController.login);

// change password
router.post("/change-password", [checkJWT], AuthController.changePassword);

export default router;
