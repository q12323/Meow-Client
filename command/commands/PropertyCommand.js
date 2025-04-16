import { ModuleManager } from "../../module/ModuleManager";
import { ChatUtils } from "../../utils/ChatUtils";
import { Command } from "../Command";

export class PropertyCommand extends Command {
    constructor() {

        super(ModuleManager.getNames());
    }

    run(args) {
        const module = ModuleManager.getModule(args[0]);
        let properties = module.getProperties();

        if (args.length < 2) {

            // no properties module check
            if (properties.length < 1) {
                ChatUtils.chat(`${ChatUtils.PREFIX}${module.getFormattedName()} has no properties`);
                return;
            }

            let propertyList = [`${ChatUtils.PREFIX}${module.getFormattedName()}: `];

            for (let i = 0; i <= properties.length - 1; i++) {
                propertyList.push(`&7»&r ${properties[i].getName()}: ${properties[i].getFormattedValue()}`);
            }

            ChatUtils.chat(propertyList.join("\n"));
            return;
        }

        let property = null;
        
        // match property from arg
        for (property of properties) {
            if (property.getName().replaceAll(/[-_]/g, "").toLowerCase() === args[1].replaceAll(/[-_]/g, "").toLowerCase()) {
                break;
            }
            property = null;
        }

        if (property === null) {
            ChatUtils.chat(`${ChatUtils.PREFIX}${module.getName()} has no property &o${args[1]}&r`);
            return;
        }

        if (args.length < 3) {
            
            if (property.getType() === "BOOLEAN") {
                property.setValue(!property.getValue());
                ChatUtils.chat(`${ChatUtils.PREFIX}${module.getName()}: &o${property.getName()}&r has been set to ${property.getFormattedValue()}`);
                return;
            }

            ChatUtils.chat(`${ChatUtils.PREFIX}${module.getName()}: &o${property.getName()}&r has been set to ${property.getFormattedValue()} (${property.getTypeInfo()})`);
            return;

        }

        args[2] = property.getProperValue(args[2]);

        try {
            property.setValue(args[2]);
            ChatUtils.chat(`${ChatUtils.PREFIX}${module.getName()}: &o${property.getName()}&r has been set to ${property.getFormattedValue()}`);
        } catch (error) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Invalid value for property &o${property.getName()}&r (${property.getTypeInfo()})`);
        }
        
    }
}
