import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";
import { Room } from "../entity/Room";
import { User } from "../entity/User";

class RoomController {
  static createRoom = async (req: Request, res: Response) => {
    const { name, capacity } = req.body;
    let room = new Room();
    room.name = name;

    if (capacity) {
      room.capacity = capacity;
    }

    // get authenticated user ID as host
    const host = res.locals.jwtPayload.userId;
    if (host) {
      room.host = host;
      // auto-join host to newly created room
      const userRepo = getRepository(User);
      const hostAsParticipant = await userRepo.findOneOrFail(host);
      room.participants = [hostAsParticipant];
    }

    // validate if the parameters is ok
    const errors = await validate(room);
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const roomRepo = getRepository(Room);
    try {
      await roomRepo.save(room);
    } catch (error) {
      res.status(400).json({ errors: error });
    }

    res.json({ room });
  };

  static getAll = async (req: Request, res: Response) => {
    // get rooms from DB
    const roomRepo = getRepository(Room);
    const rooms = await roomRepo.find({
      select: ["id", "guid", "name", "capacity", "host"],
      relations: ["participants", "host"],
    });

    res.json(rooms);
  };

  static getByGuid = async (req: Request, res: Response) => {
    const guid = <string>req.params.guid;
    const roomRepo = getRepository(Room);
    try {
      const room = await getRepository(Room)
        .createQueryBuilder("room")
        .where("room.guid = :guid", { guid: guid })
        .leftJoin("room.host", "host")
        .leftJoin("room.participants", "participant")
        .select(["room", "host.id", "host.username", "participant.id", "participant.username"])
        .getOne();
        
      res.json(room);
    } catch (error) {
      res.status(404).json({ errors: { message: "Room not found", error } });
    }
  };

  /**
   * @description Lets an authenticated user join a selected room
   * @param guid string
   * */
  static joinRoom = async (req: Request, res: Response) => {
    const guid = req.params.guid;
    const currentUserID = res.locals.jwtPayload.userId;
    const roomRepo = getRepository(Room);
    let room: Room;

    try {
      room = await roomRepo.findOneOrFail(
        { guid: guid },
        { relations: ["host", "participants"] }
      );
    } catch (error) {
      res.status(404).json({ errors: { message: "Room not found", error } });
    }

    // return false, if room capacity is already reached
    const totalUsersInRoom = room.participants.length; // includes the host
    if (room.capacity === totalUsersInRoom) {
      res.status(400).json({
        message: "Cannot join, room is already full. Please check with the host."
      });
      return;
    }

    // return false, if user joined the room already
    if (room.participants.filter(participant => participant.id === currentUserID).length) {
      res.status(400).json({ message: "Action not permitted. You\'re in the room already" });
      return;
    }

    // get current User object data
    const userRepository = getRepository(User);
    const currentUser = await userRepository.findOneOrFail(currentUserID);

    // add current user to selected room as participant
    room.participants = [...room.participants, currentUser];

    const errors = await validate(room);
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    try {
      await roomRepo.save(room);

      res.json({ message: "Successfully joined the room" });
    } catch (error) {
      res.status(400).json({ error });
    }
  };

  /**
   * @description Let's an authenticated user leave a room
   * @param guid string
   * */
  static leaveRoom = async (req: Request, res: Response) => {
    const guid = req.params.guid;
    const currentUserID = res.locals.jwtPayload.userId;
    const roomRepo = getRepository(Room);
    let room: Room;

    try {
      room = await roomRepo.findOneOrFail(
        { guid: guid },
        { relations: ["host", "participants"] }
      );
    } catch (error) {
      res.status(404).json({ errors: { message: "Room not found", error } });
    }

    // return false, if current user is the host of the selected room
    if (room.host.id === currentUserID) {
      res.status(400).json({ message: "Action not permitted. You\'re the host of this room. Please select a participant as new host for you to leave the room" });
      return;
    }

    // return false, if current user is not a participant of the selected room
    if (!room.participants.filter(participant => participant.id === currentUserID).length) {
      res.status(400).json({ message: "Action not permitted. You\'re not a participant of this room." });
      return;
    }

    room.participants = room.participants.filter(participant => participant.id !== currentUserID);

    const errors = await validate(room);
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    try {
      await roomRepo.save(room);

      res.json({ message: "Successfully left the room." });
    } catch (error) {
      res.status(400).json({ error });
    }
  };

  /**
   * @description Let's the authenticated user (host), change room host to other user
   * @param guid string
   * @param userID integer From request.body
   * */
  static changeHost = async (req: Request, res: Response) => {
    const guid = <string>req.params.guid;
    const { userId } = <{ userId: number }>req.body;
    const currentUserID = <number>res.locals.jwtPayload.userId;
    const roomRepo = getRepository(Room);
    let room: Room;

    // return false, if no user selected
    if (!userId) {
      res.status(400).json({ message: "Action not permitted. Please select user as the new host" });
      return;
    }

    // return false, if current user and new host (user) is the same
    if (userId === currentUserID) {
      res.status(400).json({ message: "No changes made as you're still the host of this room" });
      return;
    }

    try {
      room = await roomRepo.findOneOrFail(
        { guid: guid },
        { relations: ["host", "participants"] }
      );
    } catch (error) {
      res.status(404).json({ errors: { message: "Room not found", error } });
    }

    // return false, if current user is not the host of the selected room
    if (room.host.id !== currentUserID) {
      res.status(400).json({ message: "Action not permitted. You\'re not the host of this room" });
      return;
    }

    // get new host data
    const userRepo = getRepository(User);
    let newHost: User;

    try {
      newHost = await userRepo.findOneOrFail(userId);
    } catch (error) {
      res.status(400).json({ message: "Action not permitted. Can\'t find specified user as the new host" });
    }

    room.host = newHost;

    // add old host as participant
    if (!room.participants.filter(participant => participant.id === currentUserID).length) {
      const oldHostToParticipant = await userRepo.findOneOrFail(currentUserID);
      room.participants = [...room.participants, oldHostToParticipant];
    }

    try {
      await roomRepo.save(room);

      res.json({ message: "Successfully changed the host of this room. "});
    } catch (error) {
      res.status(400).json({ error, message: "Can\'t change host." });
    }

  };

  /**
   * @description Search for rooms where a given user is in
   * @param username string
   * */
  static searchUserRooms = async (req: Request, res: Response) => {
    const username = <string>req.params.username;
    const userRepo = getRepository(User);
    try {
      const user = await userRepo.findOneOrFail(
        { username: username },
        { select: ["id", "username"], relations: ["joinedRooms"] },
      );

      const userRooms = user.joinedRooms;
      
      res.json(userRooms);
    } catch (error) {
      res.status(400).json({ error });
    }
  };
}

export default RoomController;
