import { KeyBindingUtils } from "../../../../../utils/KeyBindingUtils";
import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { SecretThing } from "../../SecretThing";
import { Ticker } from "../../Ticker";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";

export class WalkRoute extends Route {
    constructor(room, x, y, z, awaitSecret, yaw, pitch) {
        super("walk", room, x, y, z, awaitSecret, -1);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        if (isNaN(this.yaw) || isNaN(this.pitch)) throw new Error("value is not valid");
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch;
        return obj;
    }
    
    run() {
        KeyBindingUtils.setKeyState(KeyBindingUtils.gameSettings.field_74311_E.func_151463_i(), false)
        const yaw = RoomUtils.getRealYaw(this.yaw);
        const rotation = McUtils.getRotations(yaw, this.pitch);
        if (this.awaitSecret && !SecretThing.secretClicked) {
            SilentRotationHandler.doSilentRotation();
            McUtils.setAngles(rotation[0] + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, rotation[1]);
            return;
        }
        if (Player.isSneaking()) return;
        McUtils.setAngles(rotation[0], rotation[1]);
        KeyBindingUtils.setKeyState(KeyBindingUtils.gameSettings.field_74351_w.func_151463_i(), true);
        
        this.activated = true;
        SecretThing.secretClicked = false;
    }
}