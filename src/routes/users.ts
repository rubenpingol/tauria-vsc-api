import { Router } from "express";
import UserControler from "../controllers/UserController";
import checkJWT from "../middlewares/checkJWT";
import UserController from "../controllers/UserController";

const router = Router();

// get all users
router.get("/", UserControler.getUsers);

// get one user by username
router.get("/:username", UserController.getOneByUsername);

// creates a new user
router.post("/", UserControler.newUser);

// update one user
router.patch("/", [checkJWT], UserControler.updateUser);

// delete user
router.delete("/", [checkJWT], UserController.deleteUser);

export default router;
