import { Client, Guild, GuildMember, Message } from "discord.js";

import BanListStatusController from "../services/message/BanListStatusController";
import CensorshipService from "../services/Censorship.service";
import ChannelHelper from "../services/ChannelHelper";
import ChannelService from "../services/Channel.service";
import Command from "../commands/Command";
import CurrencyService from "../services/Currency.service";
import DatabaseService from "../services/Database.service";
import GuildService from "../services/Guild.service";
import GuildStoreService from "../services/message/GuildStore.service";
import InventoryService from "../services/Inventory.service";
import MemberService from "../services/Member.service";
import MessageHelper from "../MessageHelper";
import RoleContestService from "../services/RoleContest.service";
import RoleStatusController from "../services/message/RoleList.service";

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
  public guildController: GuildService;
  public inventoryController: InventoryService;
  public memberController: MemberService;
  public banListStatusController: BanListStatusController;
  public storeStatusController: GuildStoreService;
  public roleStatusController: RoleStatusController;
  public roleContestController: RoleContestService;

  private _guild: Guild;
  private _message: Message;

  public constructor(db: DatabaseService, client: Client, guild: Guild) {
    this.db = db;
    this.client = client;
    this.guild = guild;
    this.censorController = new CensorshipService(this);
    this.channelController = new ChannelService(this);
    this.currencyController = new CurrencyService(this);
    this.guildController = new GuildService(this);
    this.inventoryController = new InventoryService(this);
    this.memberController = new MemberService(this);
    this.banListStatusController = new BanListStatusController(this);
    this.storeStatusController = new GuildStoreService(this);
    this.roleStatusController = new RoleStatusController(this);
    this.roleContestController = new RoleContestService(this);
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
