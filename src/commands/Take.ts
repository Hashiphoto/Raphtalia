import CurrencyService from "../services/Currency.service";
import Transfer from "./Transfer";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Take extends Transfer {
  public constructor(protected currencyService?: CurrencyService) {
    super();
    this.name = "Take";
    this.instructions =
      "Take money or items from the specified user. " +
      "You can take money from multiple users at once, but only one item from one user at a time.";
    this.usage = "`Take @member ($1|item name)`";
    this.aliases = [this.name.toLowerCase()];
  }
}
