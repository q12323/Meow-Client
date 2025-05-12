import { ModuleManager } from "../module/ModuleManager";
import { CommandManager } from "../command/CommandManager";
import { SkyblockUtils } from "../utils/SkyblockUtils";
import { Scheduler } from "../utils/Scheduler";
import { TickShift } from "../utils/TickShift";
import request from "requestV2";
import { APIUtils } from "../utils/APIUtils";

CommandManager.commandTrigger.register();
CommandManager.inputTrigger.register();
ModuleManager.keyBindTrigger.register();
SkyblockUtils.skyblockDetectionTrigger.register();
Scheduler.register();
TickShift.register();

let isLimbo = false;

register("chat", (message, event) => {
    isLimbo = true;
    setTimeout(() => {
        isLimbo = false;
    }, 7000);
}).setCriteria("An exception occurred in your connection, so you have been routed to limbo!");

const S40PacketDisconnect = Java.type("net.minecraft.network.play.server.S40PacketDisconnect");

register("packetreceived", (packet) => {
    const reason = packet.func_149165_c().func_150254_d();
    if (!reason.includes("socketClosed") && !reason.includes("temporarily banned") && !reason.includes("permanently banned")) return;
    
    if (isLimbo) {
        console.log("Wiped!" + reason);
    } else {
        console.log("Banned!" + reason);
    }
    request({
        url: "https://api.meowclient.cloud/v1/meow/report",
        method: "POST",
        headers: {"User-agent":"Mozilla/5.0"},
        body: {
            version: APIUtils.meowVersion,
            name: Player.getName(),
            uuid: String(Player.getUUID()),
            wiped: isLimbo,
            reason: ChatLib.removeFormatting(reason)
        }
    })
    console.log("Banned Yeah")
        
}).setFilteredClass(S40PacketDisconnect);