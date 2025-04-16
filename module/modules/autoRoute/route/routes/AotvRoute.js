import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";
import { ItemUtils } from "../../../../../utils/ItemUtils";
import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { Scheduler } from "../../../../../utils/Scheduler";
import { SecretThing } from "../../SecretThing";
import { Ticker } from "../../Ticker";
import { doZeroPingAotv } from "../../ZeroPingEtherwarp";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";

export class AotvRoute extends Route {
    constructor(room, x, y, z, awaitSecret, yaw, pitch, targetX, targetY, targetZ) {
        super("aotv", room, x, y, z, awaitSecret, 0.9);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        this.targetX = Number(targetX);
        this.targetY = Number(targetY);
        this.targetZ = Number(targetZ);
        if (isNaN(this.yaw) || isNaN(this.pitch) || isNaN(this.targetX) || isNaN(this.targetY) || isNaN(this.targetZ)) {
            throw new Error("yaw, pitch, targetX, y or z is not valid");
        }
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch;
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
                let item = items[i]
                if (this.isRouteItem(item)) {
                    index = i;
                    break;
                }
            }
        } catch (error) {
            console.log("error while finding item in hotbar: " + error);
            index = -1;
        }

        if (index === -1) {
            ChatUtils.prefixChat(`AutoRoute: no &o${this.name}&r in your hotbar!`);
            this.activated = true;
            return;
        }

        this.unpressSneakKey();

        const yaw = RoomUtils.getRealYaw(this.yaw);
        let targetPos = RoomUtils.getRealBlockPos(new BlockPos(this.targetX, this.targetY, this.targetZ).toMCBlock());
        targetPos = [targetPos.func_177958_n(), targetPos.func_177956_o(), targetPos.func_177952_p()];

        SilentRotationHandler.doSilentRotation();
        McUtils.rotate(yaw + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, this.pitch);

        if (Player.getX() - Math.floor(Player.getX()) !== 0.5 || Player.getZ() - Math.floor(Player.getZ()) !== 0.5) return;

        if (this.awaitSecret && !SecretThing.secretClicked) return;

        if (Player.isSneaking()) return;

        if (!this.isRouteItem()) {
            const result = HotbarSwapper.changeHotbar(index);
            if (!result) return;
        }

        Scheduler.schedulePostTickTask(() => {
            const offsetY = Player.getY() - Math.floor(Player.getY());
            if (offsetY !== 0 && offsetY !== 0.05) return
            if (!SecretThing.canSendC08()) return;
            SecretThing.sendUseItem();

            doZeroPingAotv(targetPos[0], targetPos[1], targetPos[2]);
            this.activated = true;
            SecretThing.secretClicked = false;
        })


    }

    unpressSneakKey() {
        // KeyBindingUtils.setKeyState(KeyBindingUtils.gameSettings.field_74311_E.func_151463_i(), false);
        McUtils.setSneaking(false);
    }

    isRouteItem(item = ItemUtils.getHeldItem()) {
        const id = ItemUtils.getSkyblockItemID(item);
        return id === "ASPECT_OF_THE_VOID" || id === "ASPECT_OF_THE_END";
    }
}
