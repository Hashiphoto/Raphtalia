import { Client, Guild, GuildMember, Message, User } from "discord.js";

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
import StoreStatusController from "../controllers/message/StoreStatusController";

export default class ExecutionContext {
  public initiator: GuildMember;
  public channelHelper: ChannelHelper;
  public messageHelper: MessageHelper;
  public command: Command;
  public db: Database;
  public client: Client;
  public raphtaliaMember: GuildMember;
  public censorController: CensorController;
  public channelController: ChannelController;
  public currencyController: CurrencyController;
  public guildController: GuildController;
  public inventoryController: InventoryController;
  public memberController: MemberController;
  public banListStatusController: BanListStatusController;
  public storeStatusController: StoreStatusController;

  private _guild: Guild;
  private _message: Message;

  public constructor(channelHelper: ChannelHelper, db: Database, client: Client) {
    this.channelHelper = channelHelper;
    this.db = db;
    this.client = client;
    this.censorController = new CensorController(this);
    this.channelController = new ChannelController(this);
    this.currencyController = new CurrencyController(this);
    this.guildController = new GuildController(this);
    this.inventoryController = new InventoryController(this);
    this.memberController = new MemberController(this);
    this.banListStatusController = new BanListStatusController(this);
    this.storeStatusController = new StoreStatusController(this);
    return this;
  }

  public get message() {
    return this._message;
  }

  public get channel() {
    return this.channelHelper.channel;
  }

  public get guild() {
    return this._guild;
  }

  public set guild(value: Guild) {
    this._guild = value;
    if (this.client.user) {
      const temp = this._guild.members.cache.get(this.client.user.id);
      if (temp) {
        this.raphtaliaMember = temp;
      }
    }
  }

  public setMessage(value: Message) {
    this._message = value;
    if (value.guild) {
      this.guild = value.guild;
    }
    if (this._message.member) {
      this.initiator = this._message.member;
    }
    return this;
  }
}
