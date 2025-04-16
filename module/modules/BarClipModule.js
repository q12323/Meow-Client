import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const mc = McUtils.mc;
const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");

// blocks hypixel just let players to go through
const IGNORE_BLOCK_LIST = [
    171 // carpet
];

export class BarClipModule extends Module {

    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {
        super("BarClip", false, 0, false);

        this.eps = 1e-3;
        this.playerWidth = 0.3;
        
        this.barMax = 0.5625; // 1/16 * 9
        this.barMin = 0.4375; // 1/16 * 7

        this.triggers.add(register(TickEvent.ClientTickEvent, (event) => this.onPostTick(event)).unregister());
        
    }

    onPostTick(event) {
        if (event.phase !== TickEvent.Phase.END) return;
        const thePlayer = Player.getPlayer();
        if (!thePlayer) return;
        const theWorld = World.getWorld();
        if (!theWorld) return;
        if (!thePlayer.field_70123_F) return;
        if (!this.isToggled()) return;
        if (!Player.asPlayerMP().isOnGround()) return;
        if (BarClipModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;

        let block0 = McUtils.getBlock(Player.getX(), Player.getY(), Player.getZ());
        let block1 = McUtils.getBlock(Player.getX(), Player.getY() + 1, Player.getZ());
        let block2 = McUtils.getBlock(Player.getX(), Player.getY() + 2, Player.getZ());
        if (block0.type.getID() !== 101 && block1.type.getID() !== 101 && block2.type.getID() !== 101) return;
        
        const offsetX = Player.getX() - Math.floor(Player.getX());
        const offsetY = Player.getY() - Math.floor(Player.getY());
        const offsetZ = Player.getZ() - Math.floor(Player.getZ());

        let isNearBar = true;
        const offsets = [offsetX, offsetY, offsetZ];
        
        if (Math.abs(offsetX - this.playerWidth - this.barMax) < this.eps) {
            offsets[0] = this.barMin - this.playerWidth - this.eps;

        } else if (Math.abs(offsetX + this.playerWidth - this.barMin) < this.eps) {
            offsets[0] = this.barMax + this.playerWidth + this.eps;

        } else if (Math.abs(offsetZ - this.playerWidth - this.barMax) < this.eps) {
            offsets[2] = this.barMin - this.playerWidth - this.eps;

        } else if (Math.abs(offsetZ + this.playerWidth - this.barMin) < this.eps) {
            offsets[2] = this.barMax + this.playerWidth + this.eps;

        } else {
            isNearBar = false;

        }

        if (!isNearBar) return;

        const aabb = thePlayer.func_174813_aQ().func_72317_d(offsets[0] - offsetX, offsets[1] - offsetY, offsets[2] - offsetZ);

        const collisionBoxes = theWorld.func_147461_a(aabb);

        for (let box of collisionBoxes) {
            let block = McUtils.getBlock(box.field_72340_a, box.field_72338_b, box.field_72339_c);
            if (!block) continue;
            if (this.canClip(block)) continue;
            return;

        }

        const clippingTo = [Player.getX() + offsets[0] - offsetX, Player.getY() + offsets[1] - offsetY, Player.getZ() + offsets[2] - offsetZ];

        if (clippingTo.some(c => isNaN(c))) return;
        
        thePlayer.func_70107_b(clippingTo[0], clippingTo[1], clippingTo[2]);
    }

    canClip(block) {
        if (IGNORE_BLOCK_LIST.includes(block.type.getID())) return true;
        if (this.isStair(McUtils.getBlock(Player.getX(), Player.getY(), Player.getZ()))) return true;
        return false;
    }

    isStair(block) {
        block = block.type.toString();
        if (block.includes("stair")) return true;
        return false;
    }

}
