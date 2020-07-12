import { Router } from "express";
import checkJWT from "../middlewares/checkJWT";
import RoomController from "../controllers/RoomController";

const router = Router();

// create room (authenticated user)
router.post("/", [checkJWT], RoomController.createRoom);

// list all rooms
router.get("/", RoomController.getAll);

// get room by guid
router.get("/:guid", RoomController.getByGuid);

// join room
router.post("/join/:guid", [checkJWT], RoomController.joinRoom);

// leave room
router.post("/leave/:guid", [checkJWT], RoomController.leaveRoom);

// change host
router.post("/change-host/:guid", [checkJWT], RoomController.changeHost);

// search room/s where a user is
router.get("/user/:username", RoomController.searchUserRooms);

export default router;
