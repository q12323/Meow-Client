import { ModuleManager } from "../../module/ModuleManager";
import { ChatUtils } from "../../utils/ChatUtils";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { Command } from "../Command";

export class BindCommand extends Command {

    constructor() {
        super(["bind", "b"]);
    }

    run(args) {
        if (args.length < 3) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Usage: ,${args[0].toLowerCase()} <&omodule&r> <&okey&r>&r`);
            return;
        }

        module = ModuleManager.getModule(args[1]);

        if (module == null) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Module not found (&o${args[1]}&r)&r`);
            return;
        }

        key = KeyBindingUtils.getKeyCode(args[2].toUpperCase());
        if (key === 0) {
            button = "mouse binding something"; // TODO
        }

        module.setKey(key);
        ChatUtils.chat(`${ChatUtils.PREFIX}Bound &o${module.getName()}&r to &l[${KeyBindingUtils.getKeyName(key)}]&r`);

    }
}