import { Router } from "express";
import UserControler from "../controllers/UserController";
import checkJWT from "../middlewares/checkJWT";
import UserController from "../controllers/UserController";

const router = Router();

// get all users
router.get("/", UserControler.listAll);

// get one user by username
router.get("/:username", UserController.getOneByUsername);

// create a new user
router.post("/", UserControler.newUser);

// edit one user
router.patch("/:id([0-9]+)", [checkJWT], UserControler.editUser);

// delete user
router.delete("/:id([0-9]+)", [checkJWT], UserController.deleteUser);

export default router;
