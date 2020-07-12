import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { User } from "../entity/User";
import { generateToken } from "../shared/util";

class UserController {

static listAll = async (req: Request, res: Response) => {
  // get users from database
  const userRepository = getRepository(User);
  const users = await userRepository.find({
    select: ["id", "username", "role"] //We dont want to send the passwords on response
  });

  //Send the users object
  res.send(users);
};

static getOneById = async (req: Request, res: Response) => {
  // get the ID from the url
  const id: number = parseInt(req.params.id);

  // get the user from database
  const userRepository = getRepository(User);
  try {
    const user = await userRepository.findOneOrFail(id, {
      select: ["id", "username", "role"] //We dont want to send the password on response
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(404).send("User not found");
  }
};

static getOneByUsername = async (req: Request, res: Response) => {
  // get username from the URL
  const username: string = req.params.username;

  // get the user from DB
  const userRepository = getRepository(User);
  try {
    const user = await userRepository.findOneOrFail(
      { username: username },
      {
        select: ["id", "username"],
        relations: ["hostedRooms", "joinedRooms"],
      }
    );
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: "User not found" });
  }
};

static newUser = async (req: Request, res: Response) => {
  // get parameters from the body
  let { username, password, role } = req.body;
  let user = new User();
  user.username = username;
  user.password = password;
  user.role = role;

  // validade if the parameters are ok
  const errors = await validate(user);
  if (errors.length > 0) {
    res.status(400).send(errors);
    return;
  }

  // hash the password, to securely store on DB
  user.hashPassword();

  // try to save. If fails, the username is already in use
  const userRepository = getRepository(User);
  try {
    user = await userRepository.save(user);
  } catch (e) {
    res.status(409).send("Username already in use");
    return;
  }

  // authenticate newly created user
  const token = generateToken({ userId: user.id, username: user.username });

  // if all ok, send 201 response
  res.status(201).json({
    token,
    username: user.username,
    message: "User created and authenticated"
  });
};

static editUser = async (req: Request, res: Response) => {
  // get the ID from the URL
  const id = req.params.id;

  // get values from the body
  const { username, role } = req.body;

  // try to find user on database
  const userRepository = getRepository(User);
  let user;
  try {
    user = await userRepository.findOneOrFail(id);
  } catch (error) {
    // if not found, send a 404 response
    res.status(404).send("User not found");
    return;
  }

  // validate the new values on model
  user.username = username;
  user.role = role;
  const errors = await validate(user);
  if (errors.length > 0) {
    res.status(400).send(errors);
    return;
  }

  // try to safe, if fails, that means username already in use
  try {
    await userRepository.save(user);
  } catch (e) {
    res.status(409).send("Username already in use");
    return;
  }
  // after all send a 204 (no content, but accepted) response
  res.status(204).send();
};

static deleteUser = async (req: Request, res: Response) => {
  // get the ID from the url
  const id = req.params.id;

  const userRepository = getRepository(User);
  let user: User;
  try {
    user = await userRepository.findOneOrFail(id);
  } catch (error) {
    res.status(404).send("User not found");
  }

  userRepository.delete(id);

  // after all send a 204 (no content, but accepted) response
  res.status(204).send();
};
};

export default UserController;
