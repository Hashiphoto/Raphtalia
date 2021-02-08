import { Client, Guild, GuildMember, Message } from "discord.js";

import BanListStatusController from "../controllers/message/BanListStatusController";
import CensorController from "../controllers/CensorController";
import ChannelController from "../controllers/ChannelController";
import ChannelHelper from "../ChannelHelper";
import Command from "../commands/Command";
import CurrencyController from "../controllers/CurrencyController";
import Database from "../db/Database";
import GuildController from "../controllers/GuildController";
import InventoryController from "../controllers/InventoryController";
import MemberController from "../controllers/MemberController";
import MessageHelper from "../MessageHelper";
import RoleStatusController from "../controllers/message/RoleStatusController";
import StoreStatusController from "../controllers/message/StoreStatusController";

export default class ExecutionContext {
  public initiator: GuildMember;
  public channelHelper: ChannelHelper;
  public messageHelper: MessageHelper;
  public command: Command;
  public db: Database;
  public client: Client;
  public raphtalia: GuildMember;
  public censorController: CensorController;
  public channelController: ChannelController;
  public currencyController: CurrencyController;
  public guildController: GuildController;
  public inventoryController: InventoryController;
  public memberController: MemberController;
  public banListStatusController: BanListStatusController;
  public storeStatusController: StoreStatusController;
  public roleStatusController: RoleStatusController;

  private _guild: Guild;
  private _message: Message;

  public constructor(db: Database, client: Client, guild: Guild) {
    this.db = db;
    this.client = client;
    this.guild = guild;
    this.censorController = new CensorController(this);
    this.channelController = new ChannelController(this);
    this.currencyController = new CurrencyController(this);
    this.guildController = new GuildController(this);
    this.inventoryController = new InventoryController(this);
    this.memberController = new MemberController(this);
    this.banListStatusController = new BanListStatusController(this);
    this.storeStatusController = new StoreStatusController(this);
    this.roleStatusController = new RoleStatusController(this);
    return this;
  }

  public get message() {
    return this._message;
  }

  public get channel() {
    return this.channelHelper.channel;
  }

  public get guild(): Guild {
    return this._guild;
  }

  public set guild(value: Guild) {
    if (!value) {
      return;
    }
    this._guild = value;
    if (this.client.user) {
      const temp = this._guild.members.cache.get(this.client.user.id);
      if (temp) {
        this.raphtalia = temp;
      }
    }
  }

  public setMessage(value: Message) {
    this._message = value;
    if (this._message.member) {
      this.initiator = this._message.member;
    }
    return this;
  }

  public setChannelHelper(channelHelper: ChannelHelper) {
    this.channelHelper = channelHelper;
    return this;
  }
}
