import { ChatUtils } from "../../utils/ChatUtils";
import { Command } from "../Command";
import { CommandList } from "../CommandList";
import { PropertyCommand } from "./PropertyCommand";

export class HelpCommand extends Command {

    constructor() {
        super(["help", "commands"]);
        
        // this.commands = [];
        // this.commands.push(new BindCommand());
        // this.commands.push(new ConfigCommand());
        // // commands.push(new HelpCommand());
        // this.commands.push({aliases : ["help", "commands"]});
        // this.commands.push(new ListCommand());
        // this.commands.push(new ToggleCommand());
        // this.commands.push(new WeaponCommand());
        // // this.commands.push(new PropertyCommand());
        
    }

    run(args) {
        if (CommandList.commands.length === 0) {
            return;
        }

        let commandList = [`${ChatUtils.PREFIX}Commands:`];
        for (let command of CommandList.commands) {
            if (command instanceof PropertyCommand) continue;
            commandList.push(`&7»&r ${command.aliases.map(cmd => "," + cmd).join(" &7/&r ")}`)
        }

        ChatUtils.chat(commandList.join("\n"));
    }
}