import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { Room } from "../entity/Room";
import { User } from "../entity/User";
import { ICreateRoom } from "../types/room";

class RoomController {
  /**
   * Create room as authenticated user and set as host
   * @param name     string      Room name
   * @param capacity number || 5 Room participants max capacity
   * */
  static createRoom = async (req: Request, res: Response) => {
    const { name, capacity } = <ICreateRoom>req.body;
    let room = new Room();
    room.name = name;

    if (capacity) {
      room.capacity = capacity;
    }

    // get authenticated user ID as host
    const hostId = res.locals.jwtPayload.userId;
    let hostAsParticipant: User;

    try {
      const userRepo = getRepository(User);
      hostAsParticipant = await userRepo.findOneOrFail(hostId);
    } catch (error) {
      res.send({error});
    }

    room.host = hostAsParticipant;
    // auto-join host to newly created room
    room.participants = [hostAsParticipant];

    // validate values of model
    const errors = await validate(room);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    const roomRepo = getRepository(Room);
    try {
      await roomRepo.save(room);
    } catch (error) {
      res.status(400).send({error});
    }

    res.status(201).send(room);
  };

  /**
   * List all rooms
   * */
  static getRooms = async (req: Request, res: Response) => {
    // get rooms from DB
    const rooms = await getRepository(Room)
      .createQueryBuilder("room")
      .leftJoin("room.host", "host")
      .leftJoin("room.participants", "participant")
      .select(["room", "host.id", "host.username", "participant.id", "participant.username"])
      .getMany();

    res.send(rooms);
  };

  /**
   * Get a room's information given a guid
   * @param guid string
   * */
  static getByGuid = async (req: Request, res: Response) => {
    const guid = <string>req.params.guid;
    let room: Room;

    try {
      room = await getRepository(Room)
        .createQueryBuilder("room")
        .where("room.guid = :guid", { guid: guid })
        .leftJoin("room.host", "host")
        .leftJoin("room.participants", "participant")
        .select(["room", "host.id", "host.username", "participant.id", "participant.username"])
        .getOne();
    } catch (error) {
      res.status(404).send({ error: {...error, message: "Room not found" } });
    }

    if (!room) {
      res.status(404).send({ error: { message: "Room not found" } });
      return;
    }

    res.send(room);
  };

  /**
   * Lets an authenticated user join a selected room
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
      res.status(404).send({error});
    }

    // return false, if room capacity is already reached
    const totalUsersInRoom = room.participants.length; // includes the host
    if (room.capacity === totalUsersInRoom) {
      res.status(400).send({
        error: { message: "Cannot join, room is already full. Please check with the host." }
      });
      return;
    }

    // return false, if user joined the room already
    if (room.participants.filter(participant => participant.id === currentUserID).length) {
      res.status(400).send({ error: { message: "Action not permitted. You\'re in the room already" } });
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

      res.send({ message: "Successfully joined the room" });
    } catch (error) {
      res.status(400).json({ error });
    }
  };

  /**
   * Let's an authenticated user leave a room
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
      res.status(404).send({error});
    }

    // return false, if current user is the host of the selected room
    if (room.host.id === currentUserID) {
      res.status(400).send({
        error: {
          message: "Action not permitted. You\'re the host of this room. Please select a participant as new host for you to leave the room"
        }
      });
      return;
    }

    // return false, if current user is not a participant of the selected room
    if (!room.participants.filter(participant => participant.id === currentUserID).length) {
      res.status(400).send({ error: { message: "Action not permitted. You\'re not a participant of this room." } });
      return;
    }

    room.participants = room.participants.filter(participant => participant.id !== currentUserID);

    const errors = await validate(room);
    if (errors.length > 0) {
      res.status(400).send({errors});
      return;
    }

    try {
      await roomRepo.save(room);

      res.send({ message: "Successfully left the room." });
    } catch (error) {
      res.status(400).send({error});
    }
  };

  /**
   * Let's the authenticated user (host), change room host to other user
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
      res.status(400).send({ error: { message: "Action not permitted. Please select user as the new host" } });
      return;
    }

    // return false, if current user and new host (user) is the same
    if (userId === currentUserID) {
      res.status(400).send({ error: { message: "No changes made as you're still the host of this room" } });
      return;
    }

    try {
      room = await roomRepo.findOneOrFail(
        { guid: guid },
        { relations: ["host", "participants"] }
      );
    } catch (error) {
      res.status(404).send({error});
    }

    // return false, if current user is not the host of the selected room
    if (room.host.id !== currentUserID) {
      res.status(400).send({ error: { message: "Action not permitted. You\'re not the host of this room" } });
      return;
    }

    // get new host data
    const userRepo = getRepository(User);
    let newHost: User;

    try {
      newHost = await userRepo.findOneOrFail(userId);
    } catch (error) {
      res.status(400).send({ error: { message: "Action not permitted. Can\'t find specified user as the new host" } });
    }

    room.host = newHost;

    // add old host as participant
    if (!room.participants.filter(participant => participant.id === currentUserID).length) {
      const oldHostToParticipant = await userRepo.findOneOrFail(currentUserID);
      room.participants = [...room.participants, oldHostToParticipant];
    }

    try {
      await roomRepo.save(room);

      res.send({ message: "Successfully changed the host of this room." });
    } catch (error) {
      res.status(400).send({ error: {...error, message: "Can\'t change host." } });
    }
  };

  /**
   * Search for rooms where a given user is in
   * @param username string
   * */
  static searchUserRooms = async (req: Request, res: Response) => {
    const username = <string>req.params.username;
    const userRepo = getRepository(User);
    try {
      const user = await userRepo.findOneOrFail(
        { username: username },
        { select: ["id", "username"], relations: ["joined_rooms"] },
      );

      const userRooms = user.joined_rooms;
      
      res.send(userRooms);
    } catch (error) {
      res.status(400).send({error});
    }
  };
}

export default RoomController;
