// import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
// import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { PropertyString } from "../../property/properties/PropertyString";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { ChatUtils } from "../../utils/ChatUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { RoomUtils } from "../../utils/RoomUtils";
import { PropertyBoolean } from "../../property/properties/PropertyBoolean";

const mc = McUtils.mc;
const GuiChat = Java.type("net.minecraft.client.gui.GuiChat");

const Forward = KeyBindingUtils.gameSettings.field_74351_w;
const Left = KeyBindingUtils.gameSettings.field_74370_x;
const Back = KeyBindingUtils.gameSettings.field_74368_y;
const Right = KeyBindingUtils.gameSettings.field_74366_z;

const OdinIceFillSolver = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.IceFillSolver");
let hasOdin = true;
let currentPatternsField;
try {
    currentPatternsField = OdinIceFillSolver.class.getDeclaredField("currentPatterns");
    currentPatternsField.setAccessible(true);
} catch (e) {
    hasOdin = false;
}

export class IceFillModule extends Module {

    static mode = new PropertyString("mode", "FAST", ["SLOW", "FAST"]);
    static delay = new PropertyInteger("delay", 1, 0, 10);
    static useMotion = new PropertyBoolean("use-motion", false);

    constructor() {
        super("IceFill", false, 0, false);

        this.resetPath();
        this.index = 0;
        this.timer = 0;

        this.triggers.add(register("WorldLoad", () => this.onWorldLoad()).unregister());
        this.triggers.add(register("Tick", () => this.onTick()).unregister());
    }

    setToggled(toggled) {
        if (hasOdin) {
            this.resetPath();
        } else toggled = false;
        super.setToggled(toggled);
    }

    onWorldLoad() {
        this.resetPath();
    }

    onTick() {
        if (!this.isToggled()) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        if (RoomUtils.getCurrentRoomName() !== "Ice Fill") return;
        if (this.path.length < 1) {
            this.scan();
            return;
        }
        if (this.isMoving()) return;
        if (Player.isSneaking()) return;
        if (!Player.asPlayerMP().isOnGround()) return;

        const x = Player.getX();
        const y = Player.getY();
        const z = Player.getZ();
        const walkSpeed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806;

        if (this.timer > 0) {
            this.timer--;
        }
    
        let currentIce = this.path[this.index];

        if (!currentIce) {
            this.index = 0;
            return;
        }
    
        let isCloseToIce = Math.hypot(currentIce[0] - x, currentIce[2] - z) < 2.5 && currentIce[1] - 1 <= y && y <= currentIce[1];
    
        if (!isCloseToIce) {
    
            let currentDistance = 2.5;
            let closestIndex = 0;
            for (let i = 0; i < this.path.length; i++) {
                let ice = this.path[i];
                let dist = Math.hypot(ice[0] - x, ice[2] - z);
                if (dist >= currentDistance || ice[1] - 1 > y || ice[1] < y) continue;
                currentDistance = dist;
                closestIndex = i;
            }
    
            this.index = closestIndex;
    
            if (currentDistance === 2.5) return;
        }
    
        currentIce = this.path[this.index];
    
        let blockId = McUtils.getBlock(currentIce[0], currentIce[1] - 1, currentIce[2]).type.getID();
        const isRegistered = blockId === 174 || blockId === 109;
        let isInIce = Math.abs(currentIce[0] - x) < 0.1 && Math.abs(currentIce[2] - z) < 0.1 && currentIce[1] === y && (this.index !== 0 || isRegistered);
    
        if (isInIce && (
            IceFillModule.mode.getValue() === "FAST"
            ? this.timer < 1
            : isRegistered
        )) {
            this.index++;
            this.timer = IceFillModule.delay.getValue() + 1;
        }
        
        currentIce = this.path[this.index];
    
        if (!currentIce) {
            this.index = 0;
            return;
        }
    
        const dx = currentIce[0] - x;
        const dz = currentIce[2] - z;
        const distance = Math.sqrt(dx * dx + dz * dz);
    
        const canMoveToIce = distance <= walkSpeed && currentIce[1] === y;

        blockId = McUtils.getBlock(currentIce[0], currentIce[1] - 1, currentIce[2]).type.getID();
    
        if ((mc.field_71462_r !== null && !(mc.field_71462_r instanceof GuiChat)) || blockId === 0) {
            McUtils.setVelocity(0, Player.getMotionY(), 0);
            return;
        }

        if (canMoveToIce && !IceFillModule.useMotion.getValue()) {
            McUtils.setVelocity(0, Player.getMotionY(), 0);
            Player.getPlayer().func_70107_b(currentIce[0], y, currentIce[2]);
        } else {
            let speedMul = 1;
            if (distance > walkSpeed) speedMul = walkSpeed / distance;
            McUtils.setVelocity(
                dx * speedMul,
                Player.getMotionY(),
                dz * speedMul
            );
        }

    }

    scan() {
        const patterns = this.getCurrentPatterns();
        if (!patterns) return;
        if (patterns.length < 1) return;
        this.resetPath();
        let lastY = 70;
        for (let vec3 of patterns) {
            let x = vec3.field_72450_a;
            let y = Math.floor(vec3.field_72448_b);
            let z = vec3.field_72449_c;
            if (lastY !== y) {
                let lastIce = this.path[this.path.length - 1];
                this.path.push([
                    (lastIce[0] + x) * 0.5,
                    y,
                    (lastIce[2] + z) * 0.5,
                ]);
            }
            this.path.push([x, y, z]);
            lastY = y;
        }
        console.log(this.path.toString())

    }

    getCurrentPatterns() {
        return hasOdin ? currentPatternsField.get(OdinIceFillSolver.INSTANCE) : null;
    }

    isMoving() {
        return KeyBindingUtils.isKeyDown(Forward.func_151463_i()) ||
        KeyBindingUtils.isKeyDown(Back.func_151463_i()) ||
        KeyBindingUtils.isKeyDown(Right.func_151463_i()) ||
        KeyBindingUtils.isKeyDown(Left.func_151463_i());
    }

    resetPath() {
        this.path = [];
    }

    getSuffix() {
        const mode = IceFillModule.mode.getValue();
        return [mode.charAt(0) + mode.slice(1).toLowerCase()];
        // return [IceFillModule.delay.getValue()];
    }
}
