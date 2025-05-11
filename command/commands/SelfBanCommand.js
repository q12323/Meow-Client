import { ChatUtils } from "../../utils/ChatUtils";
import { Command } from "../Command";

export class SelfBanCommand extends Command {

    constructor() {
        super(["selfban"]);
    }

    /**
     * 
     * @param {array} args 
     */
    run(args) {

        if (args.length < 2) {
            ChatUtils.prefixChat("&c&lWARNING! &cThis will &lActually&c Ban Your Account. If you want to continue, Use &e,selfban confirm&c.");
            return;
        }
        if (args[1].toLowerCase() == "confirm") {
            ChatUtils.prefixChat("Self Banning..");
            const windowId = Math.floor(Math.random() * 2000) - 1000;
            const actionNum = Math.floor(Math.random() * 32767);
            const accepted = Math.random() < 0.5;

            const packet = new net.minecraft.network.play.client.C0FPacketConfirmTransaction(
                windowId,
                actionNum,
                accepted
            );

            for (let i = 0; i < 100; i++) {
                Client.sendPacket(packet);
            }
        }
    }
}
