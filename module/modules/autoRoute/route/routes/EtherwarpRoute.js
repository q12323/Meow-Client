import { ChatUtils } from "../../../../../utils/ChatUtils";
import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";
import { ItemUtils } from "../../../../../utils/ItemUtils";
import { KeyBindingUtils } from "../../../../../utils/KeyBindingUtils";
import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { Scheduler } from "../../../../../utils/Scheduler";
import { SecretThing } from "../../SecretThing";
import { Ticker } from "../../Ticker";
import { doZeroPingEtherwarp } from "../../ZeroPingEtherwarp";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";

export class EtherwarpRoute extends Route {
    constructor(room, x, y, z, args, yaw, pitch) {
        super("etherwarp", room, x, y, z, args, 0);
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
        this.args.startDelay();

        McUtils.setSneaking(true);

        const yaw = RoomUtils.getRealYaw(this.yaw);
        const pitch = this.pitch;

        SilentRotationHandler.doSilentRotation();
        const rotations = McUtils.getRotations(yaw, pitch);
        McUtils.setAngles(rotations[0] + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, rotations[1]);
        
        Scheduler.schedulePostTickTask(() => {
            if (!Player.isSneaking()) return;

            if (!this.args.canExecute()) return;
            
            if (!this.isHoldingEtherwarp()) {
                const result = HotbarSwapper.changeHotbar(index);
                if (!result) return;
            }

            if (!SecretThing.canSendC08()) return;
            SecretThing.sendUseItem();
            doZeroPingEtherwarp();
            this.activated = true;
            SecretThing.secretClicked = 0;
            this.args.clearDelayTimer();
        })
    }

    isHoldingEtherwarp() {
        const held = ItemUtils.getHeldItem();
        return held && (ChatLib.removeFormatting(held.getName()).includes("Aspect of the Void") || ChatLib.removeFormatting(held.getName()).includes("Aspect of the End"));
    }
}