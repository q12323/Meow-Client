import { HUDModule } from "../module/modules/HUDModule";
import { ChatUtils } from "../utils/ChatUtils";
import { RenderUtils } from "../utils/RenderUtils";
import { CommandList } from "./CommandList";
import { BindCommand } from "./commands/BindCommand";
import { ConfigCommand } from "./commands/ConfigCommand"
import { FlipCommand } from "./commands/FlipCommand";
import { HelpCommand } from "./commands/HelpCommand";
import { HideCommand } from "./commands/HideCommand";
import { ListCommand } from "./commands/ListCommand";
import { PropertyCommand } from "./commands/PropertyCommand";
import { RouteCommand } from "./commands/RouteCommand";
import { ShowCommand } from "./commands/ShowCommand";
import { ToggleCommand } from "./commands/ToggleCommand";
import { WeaponCommand } from "./commands/WeaponCommand";

const GuiChat = Java.type("net.minecraft.client.gui.GuiChat");
const GuiTextField = Java.type("net.minecraft.client.gui.GuiTextField");

const inputFieldField = GuiChat.class.getDeclaredField("field_146415_a");
inputFieldField.setAccessible(true);

const widthField = GuiTextField.class.getDeclaredField("field_146218_h");
const heightField = GuiTextField.class.getDeclaredField("field_146219_i");

widthField.setAccessible(true);
heightField.setAccessible(true);

const C01PacketChatMessage = Java.type("net.minecraft.network.play.client.C01PacketChatMessage");

export const CommandManager = new class {

    constructor() {
        // this.commands = new Set();
        this.add(new BindCommand());
        this.add(new ConfigCommand());
        this.add(new FlipCommand());
        this.add(new HelpCommand());
        this.add(new HideCommand());
        this.add(new ListCommand());
        this.add(new PropertyCommand());
        this.add(new RouteCommand());
        this.add(new ShowCommand());
        this.add(new ToggleCommand());
        this.add(new WeaponCommand());

        this.commandTrigger = register("PacketSent", (packet, event) => {
            message = packet.func_149439_c();
            if (this.isValidCommand(message)) {
                cancel(event);
                this.handle(message);
                
            }
        }).setFilteredClass(C01PacketChatMessage).unregister();

        this.inputTrigger = register("PostGuiRender", (x, y, gui) => {
            // return;
            const currentScreen = gui;
            if (currentScreen === null) return;
            if (currentScreen instanceof GuiChat) {
                inputField = inputFieldField.get(currentScreen);
                if (!inputField) return;
                currentInput = inputField.func_146179_b();
                if (this.isValidCommand(currentInput)) {
                    xPosition = inputField.field_146209_f;
                    yPosition = inputField.field_146210_g;
                    width = widthField.get(inputField);
                    height = heightField.get(inputField);
            
                    width = currentScreen.field_146294_l;
                    height = currentScreen.field_146295_m;
                    
                    const color = HUDModule.getColor(Date.now(), 0).getRGB();
                    
                    RenderUtils.drawBorder(2, height - 14, width - 2, height - 2, 1.5, color)
                }
            }
        }).unregister();
    }

    add(command) {
        CommandList.commands.add(command);
    }

    get() {
        return CommandList.commands;
    }

    handle(msg) {
        const args = msg.substring(1).trim().split(/\s+/);
        if (args[0].length < 1) {
            ChatUtils.chat(`${ChatUtils.PREFIX}Unknown command&r`);
        } else {

            for (let command of this.get()) {

                for (let alias of command.aliases) {

                    if (args[0].toLowerCase() === alias.toLowerCase()) {
                        command.run(args);
                        return;
                    }
                }
            }
    
            ChatUtils.chat(`${ChatUtils.PREFIX}Unknown command (&o${args[0]}&r)&r`);
        }
    }

    isValidCommand(text) {
        if (text != null && text.length >= 2) {
            return text.charAt(0) == "," ? true : false;
        } else {
            return false;
        }
    }

}
