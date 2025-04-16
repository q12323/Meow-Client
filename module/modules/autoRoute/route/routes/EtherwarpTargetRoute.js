import { ChatUtils } from "../../../../../utils/ChatUtils";
import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";
import { ItemUtils } from "../../../../../utils/ItemUtils";
import { KeyBindingUtils } from "../../../../../utils/KeyBindingUtils";
import { McUtils } from "../../../../../utils/McUtils";
import { RenderUtils } from "../../../../../utils/RenderUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { Scheduler } from "../../../../../utils/Scheduler";
import { SecretThing } from "../../SecretThing";
import { Ticker } from "../../Ticker";
import { doZeroPingEtherwarp } from "../../ZeroPingEtherwarp";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";

const keybindSneak = KeyBindingUtils.gameSettings.field_74311_E;
const sneakHeight = 1.5399999618530273;

export class EtherwarpTargetRoute extends Route {
    constructor(room, x, y, z, awaitSecret, targetX, targetY, targetZ) {
        super("etherwarp_target", room, x, y, z, awaitSecret, 0);
        this.targetX = Number(targetX);
        this.targetY = Number(targetY);
        this.targetZ = Number(targetZ);
        if (isNaN(this.targetX) || isNaN(this.targetY) || isNaN(this.targetZ)) {
            this.delete();
            throw new Error("value is not valid");
        }
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.x = this.targetX;
        obj.data.y = this.targetY;
        obj.data.z = this.targetZ;
        return obj;
    }

    run() {
        let index = -1;
        try {
            const items = Player.getInventory().getItems();
            for (let i = 0; i < 9; i++) {
                let name = ChatLib.removeFormatting(String(items[i]?.getName()));
                if (name.includes("Aspect of the Void") || name.includes("Aspect of the End")) {
                    index = i;
                    break;
                }
            }
        } catch (error) {
            console.log("error while finding item in hotbar: " + error);
            index = -1;
        }

        if (index === -1) {
            ChatUtils.prefixChat(`AutoRoute: No etherwarp item in your hotbar!`);
            this.activated = true;
            return;
        }

        const targetCoords = RoomUtils.getRealCoords(this.targetX, this.targetY, this.targetZ);

        McUtils.setSneaking(true);

        SilentRotationHandler.doSilentRotation();
        const angles = this.getAngles(targetCoords[0], targetCoords[1], targetCoords[2]);
        McUtils.setAngles(angles[0] + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, angles[1]);
        
        Scheduler.schedulePostTickTask(() => {
            if (!Player.isSneaking()) return;
            if (!keybindSneak.func_151470_d()) McUtils.setSneaking(false);
            if (!SecretThing.canSendC08()) return;

            if (this.awaitSecret && !SecretThing.secretClicked) return;
    
            const lastPos = McUtils.getLastReportedPos();
            const lastLook = McUtils.getLastReportedRotations();

            const rayTraced = McUtils.rayTraceBlock(200, 1, true, lastLook[0], lastLook[1], lastPos[0], lastPos[1], lastPos[2]);
            if (rayTraced === null) return;
    
            const canEtherwarp = Math.floor(rayTraced[0]) === Math.floor(targetCoords[0]) && Math.floor(rayTraced[1]) === Math.floor(targetCoords[1]) && Math.floor(rayTraced[2]) === Math.floor(targetCoords[2]);
            if (!canEtherwarp) return;
            
            if (!this.isHoldingEtherwarp()) {
                const result = HotbarSwapper.changeHotbar(index);
                if (!result) return;
            }

            SecretThing.sendUseItem();
            const wasSneaking = Player.isSneaking();
            McUtils.setSneaking(true);
            doZeroPingEtherwarp();
            McUtils.setSneaking(wasSneaking);
            this.activated = true;
            SecretThing.secretClicked = false;
        })
    }

    isHoldingEtherwarp() {
        // return true
        const held = ItemUtils.getHeldItem();
        return held && (ChatLib.removeFormatting(held.getName()).includes("Aspect of the Void") || ChatLib.removeFormatting(held.getName()).includes("Aspect of the End"));
    }

    doRender(depth, color) {
        const coords = super.doRender(depth, color);
        const targetCoords = RoomUtils.getRealCoords(this.targetX, this.targetY, this.targetZ);
        GlStateManager.func_179094_E(); // pushMatrix
        if (!depth) GlStateManager.func_179097_i(); // disableDepth
        GlStateManager.func_179137_b(-Player.getRenderX(), -Player.getRenderY(), -Player.getRenderZ());
        GlStateManager.func_179090_x(); // disableTexture2D
        GlStateManager.func_179147_l(); // enableBlend
        GL11.glBlendFunc(770, 771);
        RenderUtils.glColor(color);
        GL11.glEnable(2848);

        GL11.glBegin(GL11.GL_LINES);
        GL11.glVertex3d(coords[0], coords[1] + 0.05, coords[2]);
        // GL11.glVertex3d(Math.floor(targetCoords[0]) + 0.5, Math.floor(targetCoords[1]) + 0.05, Math.floor(targetCoords[2]) + 0.5);
        GL11.glVertex3d(targetCoords[0], targetCoords[1], targetCoords[2]);

        GL11.glEnd();
        RenderUtils.glResetColor();
        GL11.glDisable(2848);
        GlStateManager.func_179084_k(); // disableBlend
        GlStateManager.func_179098_w(); // enableTexture2D
        if (!depth) GlStateManager.func_179126_j(); // enableDepth
        GlStateManager.func_179121_F(); // popMatrix
        return coords;
    }
    
    getAngles(x, y, z) {

        const radToDeg = 180 / Math.PI;
        const degToRad = Math.PI / 180;

        let currentYaw = Player.getYaw();
        let currentPitch = Player.getPitch();

        let yawToMove = null;
        let pitchToMove = null;
        const ex = Player.getX();
        const ey = Player.getY() + sneakHeight;
        const ez = Player.getZ();
        const tvx = x - ex;
        const tvy = y - ey;
        const tvz = z - ez;

        const yaw = currentYaw * degToRad;
        const evx = -Math.sin(yaw);
        const evz = Math.cos(yaw);

        yawToMove = Math.atan2(evx * tvz - evz * tvx, evz * tvz + evx * tvx) * radToDeg;

        pitchToMove = -Math.atan2(tvy, Math.sqrt(tvx * tvx + tvz * tvz)) * radToDeg - currentPitch;

        return [yawToMove, pitchToMove];
    }
}
