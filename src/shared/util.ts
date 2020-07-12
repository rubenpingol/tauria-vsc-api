import * as jwt from "jsonwebtoken";
import config from "../config/config";

export const generateToken = (payload: string | object): string => {
  const token = jwt.sign(
    payload,
    config.jwtSecret,
    {
      expiresIn: "1h",
    }
  );

  return token;
};
