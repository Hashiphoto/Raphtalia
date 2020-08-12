"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
class RChannel {
    constructor(channel) {
        this.o = channel;
        db_1.default.channels.get(this.o.id).then((dbChannel) => {
            this.dbChannel = dbChannel;
            this.autoDelete = dbChannel ? this.dbChannel.delete_ms >= 0 : false;
        });
    }
    /**
     * This wraps the original Discord message sending but also ensures that
     * messages sent by the bot are auto_deleted properly
     * (when delete_ms >= 0, auto delete is enabled)
     */
    send(content) {
        return this.o.send(content).then((message) => {
            if (this.autoDelete) {
                // Deletes the message after the specified delay
                message.delete(this.dbChannel.delete_ms);
            }
            return message;
        });
    }
}
exports.default = RChannel;
//# sourceMappingURL=RChannel.js.map