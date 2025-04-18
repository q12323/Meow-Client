// 고양 쏜 아우라a
import "./config/Config";
import "./module/modules/autoRoute/route/RoutesList";
import "./module/modules/autoRoute/AutoRouteConfig";
import "./module/ModuleManager";
import "./command/CommandManager";
import "./weapon/WeaponManager";
import "./trigger/Triggers";
import "./killaura"
import { ChatUtils } from "./utils/ChatUtils";
// import { sbapi } from "./skyblockapitest";

function instaClip(yaw) {
    if (yaw < -135) {
        Client.scheduleTask(0, () => {
            move(0, -1);
        })
        Client.scheduleTask(1, () => {
            move(0, -0.45);
        })
        Client.scheduleTask(2, () => {
            move(0, -1.1);
        })
    } else if (yaw < -45) {
        Client.scheduleTask(0, () => {
            move(1, 0);
        })
        Client.scheduleTask(1, () => {
            move(0.45, 0);
        })
        Client.scheduleTask(2, () => {
            move(1.1, 0);
        })
    } else if (yaw < 45) {
        Client.scheduleTask(0, () => {
            move(0, 1);
        })
        Client.scheduleTask(1, () => {
            move(0, 0.45);
        })
        Client.scheduleTask(2, () => {
            move(0, 1.1);
        })
    } else if (yaw < 135) {
        Client.scheduleTask(0, () => {
            move(-1, 0);
        })
        Client.scheduleTask(1, () => {
            move(-0.45, 0);
        })
        Client.scheduleTask(2, () => {
            move(-1.1, 0);
        })

    } else {
        Client.scheduleTask(0, () => {
            move(0, -1);
        })
        Client.scheduleTask(1, () => {
            move(0, -0.45);
        })
        Client.scheduleTask(2, () => {
            move(0, -1.1);
        })

    }
}

function move(x, z) {
    if (isNaN(x) || isNaN(z)) return;
    Player.getPlayer().func_70107_b(Player.getX() + x, Math.ceil(Player.getY()), Player.getZ() + z)
}

const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat");

register("Command", () => {
    instaClip(Player.getYaw());
}).setName("instaclip");

register("PacketReceived", (packet) => {
	if (packet.func_179841_c() === 2) return;
	const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());
    if (message !== "[NPC] Mort: Here, I found this map when I first entered the dungeon.") return;
    teams.register();
}).setFilteredClass(S02PacketChat)

register("WorldLoad", () => {
    teams.unregister();
})

const S3EPacketTeams = Java.type("net.minecraft.network.play.server.S3EPacketTeams");

let teams = register("PacketReceived", (packet) => {
    if (!ChatLib.removeFormatting(packet.func_149311_e() + packet.func_149309_f()).includes("Time Elapsed: 01s")) return;
    teams.unregister();
    if (Player.getX() - Math.floor(Player.getX()) !== 0.5) return;
    if (Player.getY() - Math.floor(Player.getY()) !== 0.625) return;
    if (Player.getZ() - Math.floor(Player.getZ()) !== 0.5) return;
    instaClip(Player.getYaw());
}).setFilteredClass(S3EPacketTeams).unregister();

// sbapi.addAuctionItemId("NECRON_HANDLE");
// sbapi.addBazaarItemId("WITHER_SHIELD_SCROLL");

// setTimeout(() => {
//     console.time("auction")
//     sbapi.updateAuctionData();
//     console.timeEnd("auction")
//     console.time("bazaar");
//     sbapi.updateBazaarData();
//     console.timeEnd("bazaar")
    
//     setTimeout(() => {
//         console.log(sbapi.getItemPrice("NECRON_HANDLE"))
//         console.log(sbapi.getItemPrice("WITHER_SHIELD_SCROLL"))
//     }, 10000);
// }, 0);

ChatUtils.prefixChat(`&aReloaded &cM&6e&eo&aw&7&o(Beta!)&a.`)
