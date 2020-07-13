import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { User } from "../entity/User";
import { generateToken } from "../shared/util";
import { IUpdateUser, INewUser } from "../types/user";

class UserController {

  /**
   * List all users from database without authentication
   * */
  static getUsers = async (req: Request, res: Response) => {
    // get users from database
    const userRepository = getRepository(User);
    const users = await userRepository.find({
      select: ["id", "username", "mobile_token"], // we dont want to send the passwords on response
      relations: ["hosted_rooms", "joined_rooms"],
    });

    // send the users object
    res.send(users);
  };

  /**
   * Gets a user given a username
   * @param username string
   * */
  static getOneByUsername = async (req: Request, res: Response) => {
    // get username from the URL
    const username = <string>req.params.username;

    // get the user from DB
    const userRepository = getRepository(User);
    try {
      const user = await userRepository.findOneOrFail(
        { username: username },
        {
          select: ["id", "username", "mobile_token"],
          relations: ["hosted_rooms", "joined_rooms"],
        }
      );
      res.send(user);
    } catch (error) {
      res.status(404).send({ error: {...error, message: "User not found" } });
    }
  };

  /**
   * Creates a new user and authenticate afterwards
   * @param username string
   * @param password string
   * @param mobile_token string (optional)
   * */
  static newUser = async (req: Request, res: Response) => {
    // get parameters from the body
    let { username, password, mobile_token } = <INewUser>req.body;
    let user = new User();
    user.username = username;
    user.password = password;
    user.mobile_token = mobile_token;

    // validade values of model
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
    } catch (error) {
      res.status(409).json({ error: { name: "UserExists", message: "Username already in use" } });
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

  /**
   * Updates user info, specifically password and/or mobile_token
   * @param old_password string
   * @param new_password string
   * @param mobile_token string (optional)
   * */
  static updateUser = async (req: Request, res: Response) => {
    const { old_password, new_password, mobile_token } = <IUpdateUser>req.body;
    const userRepo = getRepository(User);
    let user: User;

    // validate if old_password and new_password is set
    if (!(old_password && new_password)) {
      res.status(400).json({ message: "Please provide old password and/or new password to continue" });
      return;
    }

    // get current authenticated user ID
    const currentUserId = res.locals.jwtPayload.userId;
    try {
      user = await userRepo.findOneOrFail(currentUserId);
    } catch (error) {
      res.status(404).json({error});
    }

    // return false, if given old password don't match
    if (!user.checkIfUnencryptedPasswordIsValid(old_password)) {
      res.status(401).json({ message: "Old password is not valid" });
      return;
    }

    // set new values of model
    user.mobile_token = mobile_token;
    user.password = new_password;

    // validate new values of the model
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    // hash the new password and save
    user.hashPassword();

    try {
      await userRepo.save(user);
      res.status(201).json({ message: "Successfully updated info" });
    } catch (error) {
      res.status(400).json({error});
    }
  };

  /**
   * Deletes a user permanently, must be the authenticated user itself
   * */
  static deleteUser = async (req: Request, res: Response) => {
    // get the ID of current authenticated user
    const currentUserId = res.locals.jwtPayload.userId;
    const userRepository = getRepository(User);
    let user: User;

    try {
      user = await userRepository.findOneOrFail(currentUserId);
    } catch (error) {
      res.status(404).send({ error: {...error, message: "User not found" } });
    }

    userRepository.delete(currentUserId);

    // after all send a 204 (no content, but accepted) response
    res.status(204).send();
  };
};

export default UserController;
