export interface INewUser {
  username: string;
  password: string;
  mobile_token?: string;
}

export interface IUpdateUser {
  old_password: string;
  new_password: string;
  mobile_token?: string;
}
