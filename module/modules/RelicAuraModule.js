import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { HotbarSwapper } from "../../utils/HotbarSwapper";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");

const C02PacketUseEntity = Java.type("net.minecraft.network.play.client.C02PacketUseEntity");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const EntityArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand");
const mc = McUtils.mc;
const Forward = KeyBindingUtils.gameSettings.field_74351_w;

const P5BOX = {
    min: [-8, 0, -8],
    max: [134, 53, 147]
};

const RELICINDEX = 8;

// cauldron
const RED = new BlockPos(51, 7, 42);
const ORANGE = new BlockPos(57, 7, 42);
const GREEN = new BlockPos(49, 7, 44);
const BLUE = new BlockPos(59, 7, 44);
const PURPLE = new BlockPos(54, 7, 41);

// anvil
const REDL = new BlockPos(51, 6, 42);
const ORANGEL = new BlockPos(57, 6, 42);
const GREENL = new BlockPos(49, 6, 44);
const BLUEL = new BlockPos(59, 6, 44);
const PURPLEL = new BlockPos(54, 6, 41);

// pickup
const REDP = [20, 59];
const ORANGEP = [92, 56];
const GREENP = [20, 94];
const BLUEP = [91, 94];
const PURPLEP = [56, 132];

const TEST = new BlockPos(10, 8, -414);
const testName = "Testaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

let delaying = false;

export class RelicAuraModule extends Module {

    // static aiming = new PropertyString("aiming", "NONE", ["NONE", "SILENT", "LOCK"]);
    static range = new PropertyNumber("range", 6, 3, 8);
    static delay = new PropertyInteger("delay", 2, 1, 20);
    static pickup = new PropertyBoolean("pickup", true);
    static look = new PropertyBoolean("look", true);
    static place = new PropertyBoolean("place", true);

    constructor() {
        super("RelicAura", false, 0, false);

        this.lookStopper = new Set();

        this.triggers.add(register("PacketSent", (packet, event) => this.onC02PacketSent(packet, event)).setFilteredClass(C02PacketUseEntity).unregister())
        this.triggers.add(register(TickEvent.ClientTickEvent, (event) => {
            this.onTick(event);
        }).unregister());
    }

    setToggled(toggled) {
        super.setToggled(toggled);
    }

    onC02PacketSent(packet, event) {
        if (!this.isToggled()) return;
        if (!RelicAuraModule.look.getValue()) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        // p5 check
        if (
            Player.getX() > P5BOX.max[0] || Player.getX() < P5BOX.min[0] ||
            Player.getY() > P5BOX.max[1] || Player.getY() < P5BOX.min[1] ||
            Player.getZ() > P5BOX.max[2] || Player.getZ() < P5BOX.min[2]
        ) return;
        if (KeyBindingUtils.isKeyDown(Forward.func_151463_i())) return;

        const entity =  packet.func_149564_a(World.getWorld());
        const name = ChatLib.removeFormatting(String(entity?.func_71124_b(4)?.func_82833_r()));

        if (name === "Corrupted Red Relic") {
            const angles = McUtils.getAngles(RED.getX(), 0, RED.getZ() + 1, true, false);
            McUtils.setAngles(angles[0], -Player.getPitch());
            KeyBindingUtils.setKeyState(Forward.func_151463_i(), true);

            const pickup = (relicName) => {
                if (relicName !== "Corrupted Red Relic") return;
                this.lookStopper.delete(pickup);
                this.lookStopper.add(stopper);
                
            };
            const stopper = (relicName) => {
                if (relicName === "Corrupted Red Relic") return;
                this.lookStopper.delete(stopper);
                KeyBindingUtils.setKeyState(Forward.func_151463_i(), false);
            };
            const remover = (relicName) => {
                if (!KeyBindingUtils.isKeyDown(Forward.func_151463_i())) return;
                this.lookStopper.delete(pickup);
                this.lookStopper.delete(stopper);
                this.lookStopper.delete(remover);
            };
            this.lookStopper.add(remover);
            this.lookStopper.add(pickup);
        } else if (name === "Corrupted Orange Relic") {
            const angles = McUtils.getAngles(ORANGE.getX() + 1, 0, ORANGE.getZ() + 1, true, false); 
            McUtils.setAngles(angles[0], -Player.getPitch());
            KeyBindingUtils.setKeyState(Forward.func_151463_i(), true);

            const pickup = (relicName) => {
                if (relicName !== "Corrupted Orange Relic") return;
                this.lookStopper.delete(pickup);
                this.lookStopper.add(stopper);
                
            };
            const stopper = (relicName) => {
                if (relicName === "Corrupted Orange Relic") return;
                this.lookStopper.delete(stopper);
                KeyBindingUtils.setKeyState(Forward.func_151463_i(), false);
            };
            const remover = (relicName) => {
                if (!KeyBindingUtils.isKeyDown(Forward.func_151463_i())) return;
                this.lookStopper.delete(pickup);
                this.lookStopper.delete(stopper);
                this.lookStopper.delete(remover);
            };
            this.lookStopper.add(remover);
            this.lookStopper.add(pickup);
        }


    }
 
    onTick(event) {
        if (event.phase !== TickEvent.Phase.END) return;
        if (!this.isToggled()) return;
        const world = World.getWorld();
        if (!Player.getPlayer() || !world) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        // p5 check
        if (
            Player.getX() > P5BOX.max[0] || Player.getX() < P5BOX.min[0] ||
            Player.getY() > P5BOX.max[1] || Player.getY() < P5BOX.min[1] ||
            Player.getZ() > P5BOX.max[2] || Player.getZ() < P5BOX.min[2]
        ) return;

        const eyePosVec3 = Player.asPlayerMP().getEyePosition(1);

        const relicName = ChatLib.removeFormatting(String(Player.getInventory()?.getStackInSlot(RELICINDEX)?.getName()));

        for (let callback of this.lookStopper) {
            callback(relicName);
        }

        if (RelicAuraModule.pickup.getValue() && !delaying) {
            const entities = World.getAllEntitiesOfType(EntityArmorStand);
            let closestMOP = null;
            let currentDistance = RelicAuraModule.range.getValue();
            for (let entity of entities) {
                let name = String(entity.getEntity()?.func_71124_b(4)?.func_82833_r());
                if (!name.includes("Relic")) continue;
                name = ChatLib.removeFormatting(name);

                let x = Math.floor(entity.getX());
                let z = Math.floor(entity.getZ());

                if (
                    !(name === "Corrupted Red Relic" && (x === REDP[0] || x === REDP[0] + 1) && (z === REDP[1] || z === REDP[1] + 1)) &&
                    !(name === "Corrupted Orange Relic" && (x === ORANGEP[0] || x === ORANGEP[0] + 1) && (z === ORANGEP[1] || z === ORANGEP[1] + 1)) &&
                    !(name === "Corrupted Green Relic" && (x === GREENP[0] || x === GREENP[0] + 1) && (z === GREENP[1] || z === GREENP[1] + 1)) &&
                    !(name === "Corrupted Blue Relic" && (x === BLUEP[0] || x === BLUEP[0] + 1) && (z === BLUEP[1] || z === BLUEP[1] + 1)) &&
                    !(name === "Corrupted Purple Relic" && (x === PURPLEP[0] || x === PURPLEP[0] + 1) && (z === PURPLEP[1] || z === PURPLEP[1] + 1))
                ) continue;

                let mop = McUtils.getClosesetMOPOnEntity(eyePosVec3, entity.getEntity());
                if (!mop) continue;
                let dist = McUtils.getDistance3D(eyePosVec3, mop.field_72307_f);
                if (dist > currentDistance) continue;
                closestMOP = mop;
                currentDistance = dist;
                // i think distance comparing is useless
                break;
            }

            if (closestMOP) {

                McUtils.useEntity(closestMOP);
                delaying = true;
                Client.scheduleTask(RelicAuraModule.delay.getValue() - 1, () => delaying = false);
            }
        }

        // TODO: this should not use return
        if (RelicAuraModule.place.getValue() && !delaying && !mc.field_71462_r) {
            if (!relicName.includes("Relic") && !relicName.includes(testName)) {
                return;
            }
    
            let upper = null;
            let lower = null;
    
            if (relicName.includes("Red")) {
                upper = this.getMOPWithDistance(eyePosVec3, RED.toMCBlock(), world);
                lower = this.getMOPWithDistance(eyePosVec3, REDL.toMCBlock(), world);
    
            } else if (relicName.includes("Orange")) {
                upper = this.getMOPWithDistance(eyePosVec3, ORANGE.toMCBlock(), world);
                lower = this.getMOPWithDistance(eyePosVec3, ORANGEL.toMCBlock(), world);
    
            } else if (relicName.includes("Green")) {
                upper = this.getMOPWithDistance(eyePosVec3, GREEN.toMCBlock(), world);
                lower = this.getMOPWithDistance(eyePosVec3, GREENL.toMCBlock(), world);
                
            } else if (relicName.includes("Blue")) {
                upper = this.getMOPWithDistance(eyePosVec3, BLUE.toMCBlock(), world);
                lower = this.getMOPWithDistance(eyePosVec3, BLUEL.toMCBlock(), world);
                
            } else if (relicName.includes("Purple")) {
                upper = this.getMOPWithDistance(eyePosVec3, PURPLE.toMCBlock(), world);
                lower = this.getMOPWithDistance(eyePosVec3, PURPLEL.toMCBlock(), world);
    
            } else if (relicName.includes(testName)) {
                upper = this.getMOPWithDistance(eyePosVec3, TEST.toMCBlock(), world);
                lower = this.getMOPWithDistance(eyePosVec3, TEST.toMCBlock(), world);
            }
    
            if (!upper || !lower) return;
    
            let closest = null;
    
            if (upper.hitDist > lower.hitDist) {
                closest = lower;
            } else {
                closest = upper;
            }
    
            if (closest.hitDist > RelicAuraModule.range.getValue()) {
                return;
            }
    
            if (Player.getHeldItemIndex() !== RELICINDEX) {
                const result = HotbarSwapper.changeHotbar(RELICINDEX);
                if (!result) return;
            }
    
            const mop = closest.mop;
            const blockPos = mop.func_178782_a();
            const hitVec = mop.field_72307_f;
    
            const offsetX = hitVec.field_72450_a - blockPos.func_177958_n();
            const offsetY = hitVec.field_72448_b - blockPos.func_177956_o();
            const offsetZ = hitVec.field_72449_c - blockPos.func_177952_p();
    
            if (!this.isValidBlockOffset(offsetX) || !this.isValidBlockOffset(offsetY) || !this.isValidBlockOffset(offsetZ)) return;
    
            McUtils.syncCurrentPlayItem();
            Client.sendPacket(
                new C08PacketPlayerBlockPlacement(
                    blockPos,
                    mop.field_178784_b.func_176745_a(),
                    Player.getPlayer().field_71071_by.func_70448_g(),
                    offsetX,
                    offsetY,
                    offsetZ
                )
            );
    
            // swinging yay!
            Player.getPlayer().func_71038_i();
    
            delaying = true;
            Client.scheduleTask(RelicAuraModule.delay.getValue() - 1, () => delaying = false);
        }
    }

    getMOPWithDistance(eyePos, blockPos, world) {
        const mop = McUtils.getClosesetMOPOnBlock(eyePos, blockPos, world);
        if (!mop) return null;
        const hitDistance = McUtils.getDistance3D(eyePos, mop.field_72307_f);

        return {
            mop: mop,
            hitDist: hitDistance
        };
    }

    isValidBlockOffset(offset) {
        return offset >= 0 && offset <= 1;
    }

    // getSuffix() {
    //     const aiming = RelicAuraModule.aiming.getValue();
    //     if (aiming === "NONE") {
    //         return [];
    //     }
    //     if (aiming === "SILENT") {
    //         return ["Silent"];
    //     }
    //     if (aiming === "LOCK") {
    //         return ["Lock"];
    //     }
    // }
}
