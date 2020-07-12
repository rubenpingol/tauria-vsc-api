import { Router } from "express";
import auth from "./auth";
import users from "./users";
import rooms from "./rooms";

const routes = Router();

routes.use("/auth", auth);
routes.use("/users", users);
routes.use("/rooms", rooms);

export default routes;
