export interface ICreateRoom {
  name: string;
  capacity?: number;
}

export interface IChangeHost {
  user_id: number;
}
