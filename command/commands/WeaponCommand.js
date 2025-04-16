import { ChatUtils } from "../../utils/ChatUtils";
import { ItemUtils } from "../../utils/ItemUtils";
import { WeaponManager } from "../../weapon/WeaponManager";
import { Command } from "../Command";

export class WeaponCommand extends Command {

    constructor() {
        super(["weapon", "weapons"]);
    }

    run(args) {

        if (args[1]) {
            let result;

            const item = ItemUtils.getHeldItem();
            const itemName = item ? ChatLib.removeFormatting(item?.getName()) : null;
            const itemRegistryName = item ? item.getRegistryName() : null;

            if (args[1].toLowerCase() === "add") {
                result = WeaponManager.add(item);

                if (result) {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon has been added (&a&o${itemRegistryName}&r)`);
                } else {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon couldn't be added (&c&o${itemRegistryName}&r)`);
                }

                return;
            }

            if (args[1].toLowerCase() === "adduuid") {
                result = WeaponManager.addUUID(item);

                if (result) {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon has been added (&a&o${itemName}&r)`);
                } else {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon couldn't be added (&c&o${itemName}&r)`);
                }

                return;
            }

            if (args[1].toLowerCase() === "remove") {
                result = WeaponManager.remove(item);

                if (result) {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon has been removed (&a&o${itemRegistryName}&r)`);
                } else {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon couldn't be removed (&c&o${itemRegistryName}&r)`);
                }

                return;
            }
            
            if (args[1].toLowerCase() === "removeuuid") {
                result = WeaponManager.removeUUID(item);

                if (result) {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon has been removed (&a&o${itemName}&r)`);
                } else {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapon couldn't be removed (&c&o${itemName}&r)`);
                }

                return;
            }
            
            if (args[1].toLowerCase() === "clear") {
                result = WeaponManager.clear();

                if (result) {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapons have been cleared`);
                } else {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapons couldn't be cleared`);
                }

                return;
            }
            
            if (args[1].toLowerCase() === "clearuuid") {
                result = WeaponManager.clearUUID();

                if (result) {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapons have been cleared`);
                } else {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapons couldn't be cleared`);
                }

                return;
            }

            if (args[1].toLowerCase() === "list") {
                const outputArray = new Array();

                for (let id of WeaponManager.weapons) {
                    outputArray.push(id);
                }
                
                for (let uuid of WeaponManager.weaponsUUID) {
                    outputArray.push(uuid);
                }

                if (outputArray.length < 2) {
                    ChatUtils.chat(`${ChatUtils.PREFIX}No weapons`)
                } else {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Weapons:\n${outputArray.join("\n")}`);
                }
                
                return;
            }

        }

        ChatUtils.chat(`${ChatUtils.PREFIX}Usage: .${args[0]} <&oadd&r/&oaddUUID&r/&oremove&r/&oremoveUUID&r/&oclear&r/&oclearUUID&r/&olist&r>&r`);

        return;
    }
}
