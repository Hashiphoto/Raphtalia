import { Client, Guild, GuildMember, Message } from "discord.js";

import BanListStatusController from "../services/message/BanListStatusController";
import CensorshipService from "../services/Censorship.service";
import ChannelHelper from "../services/ChannelHelper";
import ChannelService from "../services/Channel.service";
import Command from "../routes/commands/Command";
import CurrencyService from "../services/Currency.service";
import DatabaseService from "../services/Database.service";
import GuildController from "../services/GuildController";
import InventoryController from "../services/InventoryController";
import MemberController from "../services/MemberController";
import MessageHelper from "../MessageHelper";
import RoleContestController from "../services/RoleContestController";
import RoleStatusController from "../services/message/RoleStatusController";
import StoreStatusController from "../services/message/StoreStatusController";

class ExecutionContext {
  public initiator: GuildMember;
  public channelHelper: ChannelHelper;
  public messageHelper: MessageHelper;
  public command: Command;
  public db: DatabaseService;
  public client: Client;
  public raphtalia: GuildMember;
  public censorController: CensorshipService;
  public channelController: ChannelService;
  public currencyController: CurrencyService;
  public guildController: GuildController;
  public inventoryController: InventoryController;
  public memberController: MemberController;
  public banListStatusController: BanListStatusController;
  public storeStatusController: StoreStatusController;
  public roleStatusController: RoleStatusController;
  public roleContestController: RoleContestController;

  private _guild: Guild;
  private _message: Message;

  public constructor(db: DatabaseService, client: Client, guild: Guild) {
    this.db = db;
    this.client = client;
    this.guild = guild;
    this.censorController = new CensorshipService(this);
    this.channelController = new ChannelService(this);
    this.currencyController = new CurrencyService(this);
    this.guildController = new GuildController(this);
    this.inventoryController = new InventoryController(this);
    this.memberController = new MemberController(this);
    this.banListStatusController = new BanListStatusController(this);
    this.storeStatusController = new StoreStatusController(this);
    this.roleStatusController = new RoleStatusController(this);
    this.roleContestController = new RoleContestController(this);
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
