import { ModuleManager } from "../../module/ModuleManager";
import { ChatUtils } from "../../utils/ChatUtils";
import { Command } from "../Command";

export class ToggleCommand extends Command {

    constructor() {
        super(["toggle", "t"]);
    }

    /**
     * 
     * @param {array} args 
     */
    run(args) {
        if (args.length < 2) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Usage: ,${args[0].toLowerCase()} <&omodule&r>&r`);
            return;
        }

        let module = ModuleManager.getModule(args[1]);

        if (!module) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Module not found (&o${args[1]}&r).&r`);
            return;
        }

        module.toggle();
        ChatUtils.chat(`${ChatUtils.PREFIX}${module.getName()}: ${(module.isToggled() ? "&a&lON" : "&c&lOFF")}&r`);

    }

}