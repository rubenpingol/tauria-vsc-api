import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config/config";
import { generateToken } from "../shared/util";

const checkJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = <string>req.headers["authorization"];
  let jwtPayload;

  // try to validate the token and get data
  try {
    jwtPayload = <any>jwt.verify(token, config.jwtSecret);
    res.locals.jwtPayload = jwtPayload;
  } catch (error) {
    // if token is not valid, respond with 401 (unauthorized)
    res.status(401).send();
    return;
  }

  // the token is valid for 1 hour
  // we want to send a new token on every request
  const { userId, username } = jwtPayload;
  const newToken = generateToken({ userId, username });
  res.setHeader("Authorization", newToken);

  // call the next middleware or controller
  next();
};

export default checkJWT;
