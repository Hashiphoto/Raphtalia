"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
class RGuild {
    constructor(channel) {
        this.o = channel;
        db_1.default.guilds.get(this.o.id).then((dbGuild) => {
            this.dbGuild = dbGuild;
        });
    }
}
exports.default = RGuild;
//# sourceMappingURL=RGuild.js.map