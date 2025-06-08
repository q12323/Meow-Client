import { ChatUtils } from "../../../../../utils/ChatUtils";
import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";
import { ItemUtils } from "../../../../../utils/ItemUtils";
import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { Scheduler } from "../../../../../utils/Scheduler";
import { SecretThing } from "../../SecretThing";
import { Ticker } from "../../Ticker";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";


export class UseItemRoute extends Route {
    constructor(room, x, y, z, args, yaw, pitch, itemName) {
        super("use_item", room, x, y, z, args, 1);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        if (isNaN(this.yaw) || isNaN(this.pitch)) {
            this.delete();
            throw new Error("value is not valid");
        }
        this.itemName = String(itemName);
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch;
        obj.data.item_name = this.itemName;
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
            ChatUtils.prefixChat(`AutoRoute: no &o${this.itemName}&r in your hotbar!`);
            this.activated = true;
            return;
        }
        this.args.startDelay();

        const yaw = RoomUtils.getRealYaw(this.yaw);
        const pitch = this.pitch;

        SilentRotationHandler.doSilentRotation();
        const rotations = McUtils.getRotations(yaw, pitch);
        McUtils.setAngles(rotations[0] + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, rotations[1]);

        
        Scheduler.schedulePostTickTask(() => {
            if (!this.args.canExecute()) return;
            if (!this.isRouteItem()) {
                const result = HotbarSwapper.changeHotbar(index);
                if (!result) return;
            }
            
            if (!SecretThing.canSendC08()) return;
            SecretThing.sendUseItem();
            this.activated = true;
            SecretThing.secretClicked = 0;
            this.args.clearDelayTimer();
        });
    }

    isRouteItem(item = ItemUtils.getHeldItem()) {
        if (!item) return false;
        return item && ChatLib.removeFormatting(item.getName()).toLowerCase().replaceAll(/[_\-\s]/g, "").includes(this.itemName);
    }
}
