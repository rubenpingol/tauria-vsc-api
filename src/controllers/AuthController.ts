import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { validate } from "class-validator";

import { User } from "../entity/User";
import { generateToken } from "../shared/util";

class AuthControler {
  static login  = async (req: Request, res: Response) => {
    // check if username and password are set
    const { username, password } = req.body;
    if (!(username && password)) {
      res.status(400).send();
    }

    // get user from database
    const userRepository = getRepository(User);
    let user: User;

    try {
      user = await userRepository.findOneOrFail({ where: { username } });
    } catch (error) {
      res.status(401).send();
    }

    // check if encrypted password match
    if (!user.checkIfUnencryptedPasswordIsValid(password)) {
      res.status(401).send();
      return;
    }

    // generate token that is valid for 1 hour
    const token = generateToken(
      { userId: user.id, username: user.username },
    );

    // send the jwt in the response
    res.json({ token, username: user.username });
  };

  static changePassword = async (req: Request, res: Response) => {
    // get ID from JWT
    const id = res.locals.jwtPayload.userId;

    // get parameters from the body
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      res.status(400).send();
    }

    // get the user from the database
    const userRepository = getRepository(User);
    let user: User;

    try {
      user = await userRepository.findOneOrFail(id);
    } catch (id) {
      res.status(401).send();
    }

    // check if old password matches
    if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) {
      res.status(401).send();
      return;
    }
    
    // validate the model (password length)
    user.password = newPassword;
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    // hash the new password and save
    user.hashPassword();
    userRepository.save(user);

    res.status(204).send();
  };
}

export default AuthControler;
