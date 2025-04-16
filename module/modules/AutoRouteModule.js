import { Routes } from "./autoRoute/route/RoutesList";
import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyRgb } from "../../property/properties/PropertyRgb";
import { PropertyString } from "../../property/properties/PropertyString";
import { ChatUtils } from "../../utils/ChatUtils";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { RenderUtils } from "../../utils/RenderUtils";
import { RoomUtils } from "../../utils/RoomUtils";
import { Module } from "../Module";
import { HUDModule } from "./HUDModule";
import { SecretThing } from "./autoRoute/SecretThing";
import { BlockList } from "./autoRoute/block/BlockList";
import { RouteBlock } from "./autoRoute/block/RouteBlock";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { SilentRotationHandler } from "./autoRoute/route/SilentRotationHandler";
import { setBlockSmoothTp, setEtherwarpFix } from "./autoRoute/ZeroPingEtherwarp";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { Scheduler } from "../../utils/Scheduler"
import { PropertyInteger } from "../../property/properties/PropertyInteger";

const mc = McUtils.mc;
const LivingUpdateEvent = Java.type("net.minecraftforge.event.entity.living.LivingEvent$LivingUpdateEvent");
const MouseEvent = Java.type("net.minecraftforge.client.event.MouseEvent");
const MCBlock = Java.type("net.minecraft.block.Block");
const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");

const Forward = KeyBindingUtils.gameSettings.field_74351_w.func_151463_i();
const Left = KeyBindingUtils.gameSettings.field_74370_x.func_151463_i();
const Back = KeyBindingUtils.gameSettings.field_74368_y.func_151463_i();
const Right = KeyBindingUtils.gameSettings.field_74366_z.func_151463_i();

let hasZpew = FileLib.exists(Config.modulesFolder + "/ZeroPingEtherwarp/index.js");

// TODO: idk why is this out here
function unpressMoveKeys() {
    KeyBindingUtils.setKeyState(Forward, false);
    KeyBindingUtils.setKeyState(Left, false);
    KeyBindingUtils.setKeyState(Back, false);
    KeyBindingUtils.setKeyState(Right, false);
}
let pretick = 0
register("tick", () => pretick = Date.now())

export class AutoRouteModule extends Module {

    static warning = new PropertyString("dont-use-zpew-for-this", "PLEASE", ["PLEASE", "ZPHONLY"]);
    
    static color = new PropertyString("color", "CUSTOM", ["HUD", "CUSTOM"]);
    static customColor = new PropertyRgb("custom-color", "FF80FF");
    static depth = new PropertyBoolean("depth", false);
    static editMode = new PropertyBoolean("edit-mode", false);
    static rotation = new PropertyBoolean("rotation", false);
    static noSmoothTp = new PropertyBoolean("no-smooth-tp", false);

    static etherwarpFix = new PropertyBoolean("etherwarp-fix", true);
    static c08Delay = new PropertyNumber("c08-delay", 200, 50, 2000);
    static swingToRetry = new PropertyBoolean("swing-to-retry", true);
    static ignoreMimicChest = new PropertyBoolean("ignore-mimic-chest", true);
    static zeroTick = new PropertyBoolean("zero-tick", false);
    static throttleTps = new PropertyNumber("throttle-tps", 15, 2, 20);
    static releaseTps = new PropertyNumber("release-tps", 21, 20, 100);
    static maxShiftedTicks = new PropertyInteger("max-shifted-ticks", 5, 1, 10);

    static selectedBlock = 0;

    constructor() {
        super("AutoRoute", false, 0, false);

        AutoRouteModule.rotation.onProperty((value) => {
            SilentRotationHandler.blockSilentRotation = value;
        });

        AutoRouteModule.noSmoothTp.onProperty((value) => {
            setBlockSmoothTp(value);
        });

        AutoRouteModule.c08Delay.onProperty((value) => {
            SecretThing.c08SendDelay = value;
        });
        
        AutoRouteModule.ignoreMimicChest.onProperty((value) => {
            SecretThing.registerTrapChest = !value;
        });

        AutoRouteModule.etherwarpFix.onProperty((value) => {
            setEtherwarpFix(value);
        })

        this.mouseOver = null;

        this.triggers.add(register("Tick", () => {
            this.updateMouseOver();
            this.updateBlocks();
        }).unregister());

        this.triggers.add(register(TickEvent.PlayerTickEvent, (event) => this.onUpdatePost(event)).unregister());
        
        this.triggers.add(register("RenderWorld", (partialTicks) => this.onRenderWorld(partialTicks)).unregister());
        this.triggers.add(register(MouseEvent, (event) => this.onMouseEvent(event)).unregister());
    }

    setToggled(toggled) {
        if (this.isZpewToggled() && toggled) {
            // cus bloom uses packet to detect etherwarp
            // soshimee's is safe for this
            ChatUtils.prefixChat("DO NOT USE BLOOM ZPEW WITH THIS");
            toggled = false;
        }
        if (toggled) SecretThing.register();
        else SecretThing.unregister();
        super.setToggled(toggled);
    }

    updateMouseOver() {
        this.mouseOver = mc.field_71476_x;
    }

    onUpdatePost(event) {
        if (event.phase !== TickEvent.Phase.END) return;
        const entity = event.player;
        if (entity === null) return;
        if (entity !== Player.getPlayer()) return;
        if (event.isCanceled()) return;
        if (!this.isToggled()) return;
        if (this.isZpewToggled()) {
            this.setToggled(false);
            ChatUtils.prefixChat("AutoRoute toggled off! DO NOT USE BLOOM ZPEW WITH THIS");
            return;
        }
        if (!SkyblockUtils.isInSkyblock()) return;
        if (AutoRouteModule.editMode.getValue()) return;
        if (this.isMoving()) return;

        const routesQueue = this.getRoutesQueue();
        if (routesQueue.length === 0) return;
        // ChatLib.chat(routesQueue.map(r => r.type).toString())
        McUtils.setVelocity(0, Player.getMotionY(), 0);
        unpressMoveKeys();

        routesQueue[0].run();
        if (!AutoRouteModule.zeroTick.getValue()) return;
        if (!routesQueue[0].activated && routesQueue[0].awaitSecret && !SecretThing.secretClicked) {
            Scheduler.scheduleLowestPostTickTask(() => {
                let tps = AutoRouteModule.throttleTps.getValue();
                if (tps === 20) return;
                const elapsedTicks = mc.field_71428_T.field_74280_b;
                if (elapsedTicks >= AutoRouteModule.maxShiftedTicks.getValue()) tps = AutoRouteModule.releaseTps.getValue();
                const tick = 1000 / tps;
                const escape = pretick + tick;
                while (Date.now() < escape) {}
            });
        }
    }

    getRoutesQueue(reset = false) {
        const routes = Routes.getRoom(RoomUtils.getCurrentRoomName());
        if (!routes) return [];
        let routesQueue = [];
        for (let route of routes) {
            if (route.deleted) continue;
            if (this.isInRoute(route)) {
                if (reset) route.reset();
                if (!route.activated) routesQueue.push(route);
            } else {
                route.reset();
            }
        }

        routesQueue.sort((a, b) => a.priorty - b.priority);

        return routesQueue || [];
    }

    isMoving() {
        const f = KeyBindingUtils.isKeyDown(Forward);
        const b = KeyBindingUtils.isKeyDown(Back);
        const r = KeyBindingUtils.isKeyDown(Right);
        const l = KeyBindingUtils.isKeyDown(Left);
        
        return f || b || r || l;
    }

    isInRoute(route) {
        if (route.deleted) {
            return false;
        }
        const crds = this.getRealCoords(route);

        return Math.abs(Player.getX() - crds[0]) < 0.5 && Math.abs(Player.getY() - crds[1]) < 0.6 && Math.abs(Player.getZ() - crds[2]) < 0.5;
    }

    onRenderWorld(partialTicks) {
        if (!this.isToggled()) return;

        if (AutoRouteModule.editMode.getValue()) {
            const color = AutoRouteModule.color.getValue() === "HUD" ? HUDModule.getColor(Date.now(), 0).getRGB()
            : AutoRouteModule.customColor.getColor().getRGB();
            const rayTrace = McUtils.rayTraceBlock(200, partialTicks, true);
            if (rayTrace) {
                // ChatLib.chat(rayTrace.join(", "))
                GlStateManager.func_179094_E(); // pushMatrix
                GlStateManager.func_179097_i(); // disableDepth
                GlStateManager.func_179137_b(rayTrace[0] - Player.getRenderX(), rayTrace[1] - Player.getRenderY(), rayTrace[2] - Player.getRenderZ());
                GlStateManager.func_179114_b(-mc.func_175598_ae().field_78735_i, 0, 1, 0);
                GlStateManager.func_179114_b(mc.func_175598_ae().field_78732_j, 1, 0, 0);
                
                
                // RenderUtils.drawCircle(0.05, color, 4);
                RenderUtils.drawBorder(-0.05, -0.05, 0.05, 0.05, 2, color);
    
                GlStateManager.func_179126_j(); // enableDepth
                GlStateManager.func_179121_F(); // popMatrix
            }
        }

        const routes = Routes.getRoom(RoomUtils.getCurrentRoomName());
        if (!routes) return;
        const depth = AutoRouteModule.depth.getValue();
        let i = 0;
        for (let route of routes) {
            let color = AutoRouteModule.color.getValue() === "HUD" ? HUDModule.getColor(Date.now(), i).getRGB()
            : AutoRouteModule.customColor.getColor().getRGB();
            i++;

            route.doRender(depth, color);
        }

    }

    doSwingReset() {
        if (!this.isToggled()) return;
        if (!AutoRouteModule.swingToRetry.getValue()) return;
        let routesQueue = this.getRoutesQueue();
        if (routesQueue.length === 0) {
            routesQueue = this.getRoutesQueue(true);
            if (routesQueue.length === 0) return;
        }
        routesQueue[0].swingReset();
    }

    getRealCoords(route) {
        const coords = RoomUtils.getRealCoords(route.x, route.y, route.z);
        return [coords[0], coords[1], coords[2]];
    }

    updateBlocks() {
        if (!this.isToggled()) return;
        // const currentRoomName = RoomUtils.getCurrentRoomName();
        const blocks = BlockList.get(RoomUtils.getCurrentRoomName());
        const world = World.getWorld();
        for (let block of blocks) {
            block.setBlock(world);
        }
    }

    onMouseEvent(event) {
        if (!this.isToggled()) return;
        if (event.button === -1) return;
        if (!event.buttonstate) return;
        if (event.button === 0 && mc.field_71462_r === null) {
            this.doSwingReset();
        }
        if (!AutoRouteModule.selectedBlock) return;
        const mouseOver = this.mouseOver;
        if (!mouseOver) return;
        if (mouseOver.field_72313_a.toString() !== "BLOCK") return;

        const blockPos = mouseOver.func_178782_a();
        const roomName = RoomUtils.getCurrentRoomName();

        if (event.button === 0) {
            const relPos = RoomUtils.getRelativeBlockPos(blockPos);
            const prevBlock = BlockList.getBlockAt(roomName, relPos);

            if (!prevBlock) {
                new RouteBlock(roomName, relPos, MCBlock.func_176220_d(0));
            } else {
                prevBlock.delete();
                McUtils.setBlock(World.getWorld(), RoomUtils.getRealBlockPos(relPos), MCBlock.func_176220_d(0));
            }

            cancel(event);
        } else if (event.button === 1) {
            let x = blockPos.func_177958_n();
            let y = blockPos.func_177956_o();
            let z = blockPos.func_177952_p();
            const dir = mouseOver.field_178784_b.func_176745_a()

            if (dir === 0) {
                y--;
            } else if (dir === 1) {
                y++;
            } else if (dir === 2) {
                z--;
            } else if (dir === 3) {
                z++;
            } else if (dir === 4) {
                x--;
            } else if (dir === 5) {
                x++;
            } else return;
            
            const relPos = RoomUtils.getRelativeBlockPos(new BlockPos(x, y, z).toMCBlock());
            new RouteBlock(roomName, relPos, MCBlock.func_176220_d(AutoRouteModule.selectedBlock));
            cancel(event);
        }
    }

    isZpewToggled() {
        if (!hasZpew) return false;
        try {
            const zpewConfig = JSON.parse(FileLib.read(Config.modulesFolder + "/ZeroPingEtherwarp/data.json"));
            return zpewConfig.enabled;
        } catch (error) {
            console.log("error while checking zpew config: " + error);
            return false;
        }
    }
}
