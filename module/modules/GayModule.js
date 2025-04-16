import { Module } from "../Module";

const ChatComponentText = Java.type("net.minecraft.util.ChatComponentText");
const ChatComponentTextTextField = ChatComponentText.class.getDeclaredField("field_150267_b");
ChatComponentTextTextField.setAccessible(true);

const colorCodes = ['§c', '§6', '§e', '§a', '§b', '§9', '§d'];

function getRainbowCode(offset) {
    return colorCodes[offset % colorCodes.length];
}

export class GayModule extends Module {
    constructor() {
        super("Gay", false, 0, false);

        this.globalOffset = 0;

        this.triggers.add(register("Chat", (event) => this.onChat(event)).unregister());
    }

    setToggled(toggled) {
        this.globalOffset = 0;
        super.setToggled(toggled);
    }

    onChat(event) {
        if (!this.isToggled()) return;
        // 2 is action bar
        if (event.type === 2) return;

        const siblings = event.message.func_150253_a();
        this.makeTextRainbow(event.message);
    
        for (let component of siblings) {
            this.makeTextRainbow(component);
        }
    }

    makeTextRainbow(textComponent) {
        let text = ChatLib.removeFormatting(textComponent.func_150261_e()).split("");
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (char === " " || char === "\n") continue;
            text[i] = getRainbowCode(this.globalOffset) + char;
            this.globalOffset++;
        }
        ChatComponentTextTextField.set(textComponent, text.join(""));
    }
}