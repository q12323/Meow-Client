import { ItemUtils } from "../../../../../utils/ItemUtils";
import { KeyBindingUtils } from "../../../../../utils/KeyBindingUtils";
import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { ChatUtils } from "../../../../../utils/ChatUtils";
import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";
import { Ticker } from "../../Ticker";
import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";

export class BoomRoute extends Route {
    constructor(room, x, y, z, awaitSecret, yaw, pitch) {
        super("boom", room, x, y, z, awaitSecret, 3);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        if (isNaN(this.yaw) || isNaN(this.pitch)) {
            this.delete();
            throw new Error("value is not valid");
        }

    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch;
        return obj;
    }

    run() {
        let index = -1;
        try {
            const items = Player.getInventory().getItems();
            for (let i = 0; i < 9; i++) {
                if (this.isBoom(items[i])) {
                    index = i;
                    break;
                }
            }
        } catch (error) {
            console.log("error while finding superboom in hotbar: " + error);
            index = -1;
        }

        if (index === -1) {
            ChatUtils.prefixChat(`AutoRoute: No superboom item in your hotbar!`);
            this.activated = true;
            return;
        }

        const yaw = RoomUtils.getRealYaw(this.yaw);
        const pitch = this.pitch;

        if (this.awaitSecret && !SecretThing.secretClicked) {
            SilentRotationHandler.doSilentRotation();
            McUtils.rotate(yaw + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, pitch);
            return;
        }

        McUtils.rotate(yaw + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, pitch);

        if (!this.isBoom()) {
            const result = HotbarSwapper.changeHotbar(index);
            if (!result) return;
        }

        KeyBindingUtils.setLeftClick(true);
        KeyBindingUtils.setLeftClick(false);

        this.activated = true;

    }

    isBoom(item = ItemUtils.getHeldItem()) {
        if (!item) return false;
        return item.getName().toLowerCase().includes("boom");
    }
}
