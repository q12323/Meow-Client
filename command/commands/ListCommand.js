import { ModuleManager } from "../../module/ModuleManager";
import { ChatUtils } from "../../utils/ChatUtils";
import { Command } from "../Command";

export class ListCommand extends Command {
    
    constructor() {
        super(["list", "l", "modules", "meow"]);
    }

    run(args) {
        if (ModuleManager.getModulesArray().size === 0) {
            return;
        }

        const moduleList = [`${ChatUtils.PREFIX}Modules:&r`];

        for (let module of ModuleManager.getModulesArray()) {
            
            moduleList.push(`${module.isHidden() ? "&8" : "&7"}»&r ${module.getFormattedName()}&r`);
        }

        ChatUtils.chat(moduleList.join("\n"));
    }
}