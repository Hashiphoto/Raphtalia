import { GuildMember } from "discord.js";
import { inject, injectable } from "tsyringe";
import FighterRepository from "../repositories/Fighter.repository";

@injectable()
export default class FighterService {
  public constructor(@inject(FighterRepository) private _fighterRepository: FighterRepository) {}

  public async getByUser(user: GuildMember) {
    return this._fighterRepository.getOrCreate(user.guild.id, user.id);
  }
}
