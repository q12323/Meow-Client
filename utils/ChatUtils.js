export class ChatUtils {

    static codes = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    static PREFIX = "&7[&cM&6e&eo&aw&7]&r ";

    static getRandomColor = () => {
            return "§" + ChatUtils.codes[Math.floor(Math.random() * 62)];
    }

    /**
     * output minecraft chat message
     * @param {string} msg 
     */
    static chat(msg) {
        ChatLib.chat(msg + ChatUtils.getRandomColor() + ChatUtils.getRandomColor() + ChatUtils.getRandomColor() + ChatUtils.getRandomColor());
    }

    static prefixChat(msg) {
        ChatUtils.chat(ChatUtils.PREFIX + String(msg));
    }


}
