import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";

export class LookRoute extends Route {
    constructor(room, x, y, z, args, yaw, pitch) {
        super("look", room, x, y, z, args, 9);
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
        this.args.startDelay();
        if (!this.args.canExecute()) return;
        const yaw = RoomUtils.getRealYaw(this.yaw);
        const rotation = McUtils.getRotations(yaw, this.pitch);
        McUtils.setAngles(rotation[0], rotation[1]);
        
        this.activated = true;
        SecretThing.secretClicked = false;
        this.args.clearDelayTimer();
        return true;
    }
}
