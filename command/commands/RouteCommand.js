import { AutoRouteConfig } from "../../module/modules/autoRoute/AutoRouteConfig";
import { BlockList } from "../../module/modules/autoRoute/block/BlockList";
import { RouteManager } from "../../module/modules/autoRoute/route/RouteManager";
import { AlignRoute } from "../../module/modules/autoRoute/route/routes/AlignRoute";
import { AotvRoute } from "../../module/modules/autoRoute/route/routes/AotvRoute";
import { BatRoute } from "../../module/modules/autoRoute/route/routes/BatRoute";
import { BoomRoute } from "../../module/modules/autoRoute/route/routes/BoomRoute";
import { ClipRoute } from "../../module/modules/autoRoute/route/routes/ClipRoute";
import { CommandRoute } from "../../module/modules/autoRoute/route/routes/CommandRoute";
import { EtherwarpTargetRoute } from "../../module/modules/autoRoute/route/routes/EtherwarpTargetRoute";
import { HypeRoute } from "../../module/modules/autoRoute/route/routes/HypeRoute";
import { JumpRoute } from "../../module/modules/autoRoute/route/routes/JumpRoute";
import { LookRoute } from "../../module/modules/autoRoute/route/routes/LookRoute";
import { PearlClipRoute } from "../../module/modules/autoRoute/route/routes/PearlClipRoute";
import { StopRoute } from "../../module/modules/autoRoute/route/routes/StopRoute";
import { UseItemRoute } from "../../module/modules/autoRoute/route/routes/UseItemRoute";
import { WalkRoute } from "../../module/modules/autoRoute/route/routes/WalkRoute";
import { Routes } from "../../module/modules/autoRoute/route/RoutesList";
import { AutoRouteModule } from "../../module/modules/AutoRouteModule";
import { ChatUtils } from "../../utils/ChatUtils";
import { McUtils } from "../../utils/McUtils";
import { RoomUtils } from "../../utils/RoomUtils";
import { Scheduler } from "../../utils/Scheduler";
import { Command } from "../Command";

const mc = McUtils.mc;
const MCBlock = Java.type("net.minecraft.block.Block");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

export class RouteCommand extends Command {
    constructor() {
        super(["route", "routes"]);
    }

    run(args) {
        if (args.length < 2) {
            ChatUtils.prefixChat(`Usage: ,${args[0]} &oadd&r/&oremove&r/&oblock&r/&oclear&r/&oload&r/&osave&r [&oargs&r...]`);
            return;
        } else {
            switch(args[1].toLowerCase()) {
                case "add":
                    this.addRoute(args);
                    break;

                case "remove":
                    this.removeRoute(args);
                    break;

                case "block":
                    this.selectBlock(args);
                    break;

                case "clear":
                    this.clearRoutes(args);
                    break;

                case "load":
                    this.loadRoute(args);
                    break;

                case "save":
                    this.saveRoute(args);
                    break;

                default:
                    ChatUtils.prefixChat(`Usage: ,${args[0]} &oadd&r/&oremove&r/&oblock&r/&oclear&r/&oload&r/&osave&r [&oargs&r...]`);
                    break;
            }
        }
    }

    addRoute(args) {
        if (args.length < 3) {
            ChatUtils.prefixChat(`Usage: ,${args[0]} ${args[1]} <type> [args]`);
            return;
        }

        const playerCoords = RoomUtils.getRelativeCoords(Math.floor(Player.getX()) + 0.5, Math.floor(Player.getY()), Math.floor(Player.getZ()) + 0.5);
        // console.log(playerCoords.join(", "));
        const roomName = RoomUtils.getCurrentRoomName();
        const routeArgs = {};

        const setRouteArg = (name, value) => {
            name = name?.toLowerCase();
            value = value?.toLowerCase();
            switch (name) {
                case "true":
                case "awaitsecret":
                case "await":
                case "bat":
                case "item":
                case "secret": {
                    value = Number(value);
                    if (isNaN(value)) value = 1;
                    routeArgs.await_secret = value;
                    break;
                }

                case "delay": {
                    value = Number(value);
                    if (!isNaN(value)) {
                        routeArgs.delay = value;
                    }
                    break;
                }

                case "block": {
                    value = value?.split(";") || [];
            
                    let id = Number(value[0]);
                    let meta = Number(value[1]);
                    let x = Number(value[2]);
                    let y = Number(value[3]);
                    let z = Number(value[4]);
                    

                    if (isNaN(id)) id = 0;
                    if (isNaN(meta)) meta = 0;
                    if (isNaN(x) || isNaN(y) || isNaN(z)) {
                        let blockPos = mc.field_71476_x?.func_178782_a();
                        if (!blockPos) break;
                        x = blockPos.func_177958_n();
                        y = blockPos.func_177956_o();
                        z = blockPos.func_177952_p();
                    }
            
                    const pos = RoomUtils.getRelativeBlockPos(new BlockPos(x, y, z).toMCBlock());
                    x = pos.func_177958_n();
                    y = pos.func_177956_o();
                    z = pos.func_177952_p();
                    
                    routeArgs.block = { x, y, z, id, meta };
                    break;
                }

                default:
                    console.log(`unexpected argument ${name}`);
            }
        }

        for (let i = 3; i < args.length; i++) {
            let [name, value] = args[i].split(":");
            setRouteArg(name, value);
        }

        const yaw = RoomUtils.getRelativeYaw(Player.getYaw());
        const pitch = Player.getPitch();

        const type = args[2].replaceAll(/[-_]/g, "").toLowerCase();

        try {
            switch(type) {
                case "etherwarptarget":
                    const rayTrace = McUtils.rayTraceBlock(200, 1, true);
                    if (!rayTrace) throw new Error("no block in look");

                    const target = RoomUtils.getRelativeCoords(...rayTrace);
                    new EtherwarpTargetRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, target[0], target[1], target[2]);
                    ChatUtils.prefixChat("&aetherwarp_target&r Route has been added");
                    break;

                case "walk":
                    new WalkRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch);
                    ChatUtils.prefixChat("&awalk&r Route has been added");
                    break;

                case "boom":
                    new BoomRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch);
                    ChatUtils.prefixChat("&aboom&r Route has been addedd");
                    break;

                case "stop":
                    new StopRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs);
                    ChatUtils.prefixChat("&astop&r Route has been added");
                    break;

                case "align":
                    new AlignRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs);
                    ChatUtils.prefixChat("&aalign&r Route has been added");
                    break;

                case "look":
                    new LookRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch);
                    ChatUtils.prefixChat("&alook&r Route has been added");
                    break;

                case "jump":
                    new JumpRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs);
                    ChatUtils.prefixChat("&ajump&r Route has been added");
                    break;

                case "clip":
                    new ClipRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch, 1);
                    ChatUtils.prefixChat("&aclip&r Route has been added");
                    break;

                case "command":
                    ChatUtils.prefixChat("Usage: ,route add command:/name;arg1;arg2;arg3...");
                    break;

                case "bat":
                case "hype":
                case "aotv": {
                    ChatUtils.prefixChat(`recording ${type} do not move!`);
                    const timeClicked = Date.now();
                    McUtils.sendUseItem();
                    Scheduler.scheduleLowS08Task((packet, event) => {
                        if (timeClicked + 5000 < Date.now()) {
                            ChatUtils.prefixChat(`${type} record timeout`);
                            return;
                        }
                        let x = Math.floor(packet.func_148932_c());
                        let y = packet.func_148928_d();
                        let z = Math.floor(packet.func_148933_e());
                        const flag = packet.func_179834_f();
    
                        if (flag.includes(S08PacketPlayerPosLook.EnumFlags.X) ||
                        flag.includes(S08PacketPlayerPosLook.EnumFlags.Y) ||
                        flag.includes(S08PacketPlayerPosLook.EnumFlags.Z) ||
                        event.isCanceled() ||
                        y - Math.floor(y) !== 0) {
                            ChatUtils.prefixChat("invalid packet")
                            return;
                        }

                        const relTarget = RoomUtils.getRelativeBlockPos(new BlockPos(x, y, z).toMCBlock());

                        Scheduler.schedulePostTickTask(() => {
                            try {
                                if (type === "aotv") 
                                    new AotvRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch, relTarget.func_177958_n(), relTarget.func_177956_o(), relTarget.func_177952_p());
                                else if (type === "hype") 
                                    new HypeRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch, relTarget.func_177958_n(), relTarget.func_177956_o(), relTarget.func_177952_p());
                                else    
                                    new BatRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch, relTarget.func_177958_n(), relTarget.func_177956_o(), relTarget.func_177952_p());
                            
                                ChatUtils.prefixChat(`&a${type}&r Route has been added`);
                            } catch (error) {
                                console.log("error while adding route: " + error);
                                ChatUtils.prefixChat(`&c&o${args[2]}&r Route couldn't be added`);
                            }
                        })
                    })
                    break;
                }

                default:
                    if (type.startsWith("useitem:")) {
                        new UseItemRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch, type.slice(8).toLowerCase().replaceAll(/[_\-\s]/g, ""));
                        ChatUtils.prefixChat("&ause_item&r Route has been added");
                        break;
                    } else if (type.startsWith("pearlclip:")) {
                        new PearlClipRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, Number(type.slice(10)));
                        ChatUtils.prefixChat("&apearl_clip&r Route has been added");
                        break;
                    } else if (type.startsWith("rightclick:")) {
                        // new RightClickRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], awaitSecret, arg2.slice(11).toLowerCase().replaceAll(/[_\-\s]/g, ""));
                        // ChatUtils.prefixChat("&aright_click&r Route has been added");
                        ChatUtils.prefixChat("no more rightclick route");
                        break;
                    } else if (type.startsWith("clip:")) {
                        new ClipRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, yaw, pitch, Number(type.slice(5)));
                        ChatUtils.prefixChat("&aclip&r Route has been added");
                        break;
                    } else if (type.startsWith("command:")) {
                        const commandArgs = type.slice(8).split(";");
                        if (!commandArgs.length) {
                            ChatUtils.prefixChat("Usage: ,route add command:/name;arg1;arg2;arg3...");
                            break;
                        }

                        const command = commandArgs.join(" ");
                        new CommandRoute(roomName, playerCoords[0], playerCoords[1], playerCoords[2], routeArgs, command);
                        ChatUtils.prefixChat(`&acommand&r Route has been added &o${command}&r`);
                        break;
                    }
                    
                    ChatUtils.prefixChat("Invalid value for route type (&oetherwarp_target&r/&owalk&r/&obat&r/&ouse_item&r/&opearl_clip&r/&oclip&r/&ostop&r/&olook&r/&oboom&r/&oaotv&r/&oalign&r/&ocommand&r/&ojump&r)");
                    break;

            }
        } catch (error) {
            console.log("error while adding route: " + error);
            ChatUtils.prefixChat(`&c&o${args[2]}&r Route couldn't be added`);
        }

    }

    removeRoute(args) {
        try {
            if (!args[2]) args[2] = 5;
            const targetRoute = RouteManager.removeClosestRoute(args[2]);
            if (targetRoute) {
                ChatUtils.prefixChat(`&o${targetRoute.type}&r Route has been removed`);
            } else {
                ChatUtils.prefixChat(`There are no route in range ${args[2]}`);
            }
        } catch (error) {
            console.log("error while removing route: " + error);
            ChatUtils.prefixChat("Route couldn't be removed");
        }
    }

    selectBlock(args) {
        if (args.length < 3) {
            AutoRouteModule.selectedBlock = 0;
            ChatUtils.prefixChat(`Block editing ended`);
            return;
        } else {
            try {
                const blockState = MCBlock.func_176220_d(Number(args[2]));
                const id = MCBlock.func_176210_f(blockState);
                if (id === 0) {
                    AutoRouteModule.selectedBlock = 0;
                    ChatUtils.prefixChat(`Block editing ended`);
                    return;
                } else {
                    AutoRouteModule.selectedBlock = id;
                    ChatUtils.prefixChat(`Set block to &a&o${MCBlock.field_149771_c.func_177774_c(blockState.func_177230_c()).func_110623_a()}&r`);
                    return;
                }
            } catch (error) {
                AutoRouteModule.selectedBlock = 0;
                ChatUtils.prefixChat(`Block editing ended`);
                console.log("error while selecting block" + error);
            }
        }
    }

    clearRoutes(args) {
        if (args.length < 3) {
            ChatUtils.prefixChat(`,${args[0]} ${args[1]} route/block`);
            return;
        }

        const roomName = RoomUtils.getCurrentRoomName();
        const arg2 = args[2].toLowerCase();
        if (arg2 === "block" || arg2 === "blocks") {
            // clear blocks
            BlockList.clear(roomName);
            ChatUtils.prefixChat("blocks cleared");
            return;
        }
        if (arg2 === "route" || arg2 === "routes") {
            const size = Routes.getRoom(roomName).size;
            Routes.clearRoom(roomName);
            ChatUtils.prefixChat(`&o${size}&r routes have been cleared in room &o${roomName}&r`);
            return;
        }
    }

    loadRoute(args) {
        if (args.length < 3) {
            ChatUtils.prefixChat(`Missing route name (use '&odefault&r' or '&o!&r' to change default route)&r`);
            return;
        }
        try {
            if (args[2] === "!" || args[2] === null || args[2] === "") args[2] = "default";
            AutoRouteConfig.load(args[2]);
            ChatUtils.prefixChat(`Route has been loaded (&a&o${args[2]}&a&o.&a&ojson&r)`);
        } catch (error) {
            console.log(`error while loading route ${args[2]} ${error}`);
            ChatUtils.prefixChat(`Route couldn't be loaded (&c&o${args[2]}&c&o.&c&ojson&r)`);
        }
    }

    saveRoute(args) {
        if (args.length < 3) {
            ChatUtils.prefixChat(`Missing route name (use '&odefault&r' or '&o!&r' to change default route)&r`);
            return;
        }
        try {
            if (args[2] === "!" || args[2] === null || args[2] === "") args[2] = "default";
            AutoRouteConfig.save(args[2]);
            ChatUtils.prefixChat(`Route has been saved (&a&o${args[2]}&a&o.&a&ojson&r)`);
        } catch (error) {
            console.log(`error while loading route ${args[2]} ${error}`);
            ChatUtils.prefixChat(`Route couldn't be saved (&c&o${args[2]}&c&o.&c&ojson&r)`);
        }
    }
}
