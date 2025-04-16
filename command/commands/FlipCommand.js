import { ChatUtils } from "../../utils/ChatUtils";
import { RoomUtils } from "../../utils/RoomUtils";
import { Command } from "../Command";

export class FlipCommand extends Command {
    constructor() {
        super(["flip"]);

    }

    run(args) {
        ChatUtils.prefixChat("use x/z flip module");
        return;
        if (args.length < 2) {
            ChatUtils.prefixChat(`Usage: ,${args[0]} &ox&r/&oz&r`);
        } else {
            switch (args[1].toLowerCase()) {
                case "x":
                    RoomUtils.xFlip = !RoomUtils.xFlip;
                    ChatUtils.prefixChat(`Room x rotation flipped to ${RoomUtils.xFlip}`);
                    return;

                case "z":
                    RoomUtils.zFlip = !RoomUtils.zFlip;
                    ChatUtils.prefixChat(`Room z rotation flipped to ${RoomUtils.zFlip}`);
                    return;

                default:
                    ChatUtils.prefixChat(`Usage: ,${args[0]} &ox&r/&oz&r`);
            }
        }
    }
}