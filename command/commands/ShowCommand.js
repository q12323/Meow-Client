import { ModuleManager } from "../../module/ModuleManager";
import { ChatUtils } from "../../utils/ChatUtils";
import { Command } from "../Command";

export class ShowCommand extends Command {

    constructor() {
        super(["show", "s"]);
    }

    run(args) {
        if (args.length < 2) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Usage: ,${args[0].toLowerCase()} <&omodule&r>&r`);
        } else {
            let module = ModuleManager.getModule(args[1]);
            if (module === null) {
                ChatUtils.chat(`${ChatUtils.PREFIX}Module &o${args[1]}&r not found&r`);
            } else if (!module.isHidden()) {
                ChatUtils.chat(`${ChatUtils.PREFIX}&o${module.getName()}&r is not hidden in HUD&r`);
            } else {
                module.setHidden(false);
                ChatUtils.chat(`${ChatUtils.PREFIX}&o${module.getName()}&r is no longer hidden in HUD&r`);
            }
        }
    }
}