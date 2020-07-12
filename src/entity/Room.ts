import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Generated,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable
} from "typeorm";
import { User } from "./User";
import { Length } from "class-validator";

@Entity()
export class Room {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated("uuid")
  guid: string;

  @Column()
  @Length(4, 100)
  name: string;

  @ManyToOne(type => User)
  @JoinColumn({ name: "host" })
  host: User;

  @ManyToMany(type => User, user => user.joinedRooms)
  @JoinTable()
  participants: User[];

  @Column({ default: 5 })
  capacity: number;
}
