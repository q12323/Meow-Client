import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { ItemUtils } from "../../utils/ItemUtils";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
// import { RotationUtils } from "../../utils/RotationUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";
import { SecretThing } from "./autoRoute/SecretThing";
import { AutoRouteModule } from "./AutoRouteModule";

const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const MCBlockPos = Java.type("net.minecraft.util.BlockPos");
const BlockState = Java.type("net.minecraft.block.state.BlockState");

const BlockStoneBrick = Java.type("net.minecraft.block.BlockStoneBrick");

let delaying = false;
let lastHeldIndex = -1;

export class TNTAuraModule extends Module {

    static range = new PropertyNumber("range", 1, 0, 8);
    static delay = new PropertyInteger("delay", 7, 1, 20);
    static swapBack = new PropertyBoolean("swap-back", true);
    static routeOnly = new PropertyBoolean("route-only", true);

    constructor() {
        super("TNTAura", false, 0, false);

        this.triggers.add(register(TickEvent.ClientTickEvent, (event) => this.onTick(event)).unregister());
    }

    onTick(event) {
        return;
        if (event.phase !== TickEvent.Phase.END) return;
        if (!this.isToggled()) return;
        if (!Player.getPlayer()) return;
        const world = World.getWorld();
        if (!world) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        if (TNTAuraModule.swapBack.getValue() && lastHeldIndex !== -1) {
            KeyBindingUtils.pressHotbar(lastHeldIndex);
            lastHeldIndex = -1;
        }
        const currentRoute = AutoRouteModule.getCurrentRoute();
        if (TNTAuraModule.routeOnly.getValue() && (!RotationUtils.isSilentRotating || !currentRoute || !currentRoute.awaitSecret || currentRoute.activated)) return;
        if (delaying) return;

        const eyePos = Player.asPlayerMP().getEyePosition(1);
        const range = TNTAuraModule.range.getValue();

        // const blocks = MCBlockPos.func_177980_a(
        //     new MCBlockPos(eyePos.field_72450_a - range - 0, eyePos.field_72448_b - range - 0, eyePos.field_72449_c - range - 0),
        //     new MCBlockPos(eyePos.field_72450_a + range + 0, eyePos.field_72448_b + range + 0, eyePos.field_72449_c + range + 0)
        // ).iterator();

        // ChatLib.chat(blocks.hasNext())
        let closesetDistance = range;
        let closestMOP = null;

        // while(blocks.hasNext()) {
        //     let blockPos = blocks.next();
        //     let blockState = world.func_180495_p(blockPos);
        //     if (!this.isBoomable(blockState)) continue;
        //     let mop = McUtils.getClosesetMOPOnBlock(eyePos, blockPos, world);
        //     if (!mop) continue;
        //     let dist = McUtils.getDistance3D(eyePos, mop.field_72307_f);

        //     if (dist > closesetDistance) continue;

        //     closesetDistance = dist;
        //     closestMOP = mop;
        // }

        const yaw = RotationUtils.lastReportedYaw * Math.PI / 180;
        const pitch = RotationUtils.lastReportedPitch * Math.PI / 180;
        const cosPitch = McUtils.cos(pitch);
        const dx = -cosPitch * McUtils.sin(yaw);
        const dy = -McUtils.sin(pitch);
        const dz = cosPitch * McUtils.cos(yaw);
        const look = eyePos.func_72441_c(dx * range, dy * range, dz * range);

        for (let x = eyePos.field_72450_a - range; x < eyePos.field_72450_a + range; x++) {
            for (let y = eyePos.field_72448_b - range; y < eyePos.field_72448_b + range; y++) {
                for (let z = eyePos.field_72449_c - range; z < eyePos.field_72449_c + range; z++) {
                    let blockPos = new BlockPos(Math.floor(x), Math.floor(y), Math.floor(z)).toMCBlock();
                    let blockState = world.func_180495_p(blockPos);
                    if (!this.isBoomable(blockState)) continue;
                    if (TNTAuraModule.routeOnly.getValue()) {
                        let aabb = world.func_180495_p(blockPos).func_177230_c().func_180646_a(world, blockPos);
                        let mop = aabb.func_72327_a(eyePos, look);
                        if (!mop) continue;
                    }
                    let mop = McUtils.getClosesetMOPOnBlock(eyePos, blockPos, world);
                    if (!mop) continue;
                    let dist = McUtils.getDistance3D(eyePos, mop.field_72307_f);
        
                    if (dist > closesetDistance) continue;
        
                    closesetDistance = dist;
                    closestMOP = mop;
                }
            }
        }

        if (!closestMOP) return;
        
        let boomIndex = -1;

        try {
            const items = Player.getInventory().getItems();
            for (let i = 0; i < 9; i++) {
                // if (ChatLib.removeFormatting(items[i]?.getName()).includes("boom")) {
                //     boomIndex = i;
                //     break;
                // }
                let id = ItemUtils.getSkyblockItemID(items[i]);
                if (id === "SUPERBOOM_TNT" || id === "INFINITE_SUPERBOOM_TNT") {
                    boomIndex = i;
                    break;
                }
            }
        } catch (error) {
            console.log("error while finding superboom in hotbar: " + error);
            boomIndex = -1;
        }

        if (boomIndex === -1) return;

        const held = Player.getHeldItemIndex();

        if (held !== boomIndex) {
            lastHeldIndex = held;
            KeyBindingUtils.pressHotbar(boomIndex);
            return;
        }

        const mop = closestMOP;
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

        SecretThing.secretClicked = true;

        Player.getPlayer().func_71038_i();

        
        delaying = true;
        Client.scheduleTask(TNTAuraModule.delay.getValue() - 1, () => {
            delaying = false;
        });
    }

    isBoomable(blockState) {
        const block = blockState.func_177230_c();
        if (block instanceof BlockStoneBrick) {
            const meta = block.func_176201_c(blockState);
            // if (meta === 2) ChatLib.chat("boomable!!")
            return meta === 2;
        }
        return false;
    }

    isValidBlockOffset(offset) {
        return offset >= 0 && offset <= 1;
    }
}