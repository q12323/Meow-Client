import { ConfigClass } from "../../config/Config";
import { ChatUtils } from "../../utils/ChatUtils";
import { Command } from "../Command";

export class ConfigCommand extends Command {

    constructor() {
        super(["config", "cfg", "c"]);
    }

    /**
     * 
     * @param {array} args 
     */
    run(args) {
        if (args.length < 2) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Usage: ,${args[0]} &oload&r/&osave&r <&oname&r>&r `);
            return;
        }

        if (args.length < 3) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Missing config name (use '&odefault&r' or '&o!&r' to change default config)&r`);
            return;
        }

        if (args[2] === "!" || args[2] === null || args[2] === "") args[2] = "default";

        if (args[1] === "reload" || args[1] === "load") {

            try {
                if (ConfigClass.load(args[2]) === "no file") {
                    ChatUtils.chat(`${ChatUtils.PREFIX}Config couldn't be loaded (&c&o${args[2]}&c&o.&c&ojson&r)`);
                    return;
                }
                ChatUtils.chat(`${ChatUtils.PREFIX}Config has been loaded (&a&o${args[2]}&a&o.&a&ojson&r)`);
            } catch (error) {
                console.error("error whlie loading config" + error);
                ChatUtils.chat(`${ChatUtils.PREFIX}Config couldn't be loaded (&c&o${args[2]}&c&o.&c&ojson&r)`);
            }

            return;
        }

        if (args[1] === "save") {
            try {
                ConfigClass.save(args[2]);
                ChatUtils.chat(`${ChatUtils.PREFIX}Config has been saved (&a&o${args[2]}&a&o.&a&ojson&r)`);
            } catch (error) {
                ChatUtils.chat(`${ChatUtils.PREFIX}Config couldn't be saved (&c&o${args[2]}&c&o.&c&ojson&r)`);
            }

            return;
        }

        ChatUtils.chat(`${ChatUtils.PREFIX}Invalid argument (&o%s&r)&r`);

    }
    
}