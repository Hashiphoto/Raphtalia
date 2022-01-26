import GuildItem from "../models/GuildItem";
import { GuildMember } from "discord.js";

export interface ICommandProps {
  initiator: GuildMember;
}

export interface ITargettedProps extends ICommandProps {
  targets: GuildMember[];
}

export interface IArgsProps extends ICommandProps {
  args: string[];
}

export interface IArgProps extends ICommandProps {
  arg: string;
}

export interface ITransferProps extends ITargettedProps {
  amount?: number;
  item?: GuildItem;
}
