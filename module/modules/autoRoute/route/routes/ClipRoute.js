import { RoomUtils } from "../../../../../utils/RoomUtils";
import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";

export class ClipRoute extends Route {
    constructor(room, x, y, z, args, yaw, pitch, distance) {
        super("clip", room, x, y, z, args, 0.9);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        this.distance = Number(distance);
        if (isNaN(this.yaw) || isNaN(this.pitch) || isNaN(this.distance)) {
            this.delete();
            throw new Error("value is not valid");
        }
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch;
        obj.data.distance = this.distance;
        return obj;
    }

    run() {
        this.args.startDelay();
        if (!this.args.canExecute()) return;
        
        const yaw = RoomUtils.getRealYaw(this.yaw) * Math.PI / 180;
        const x = Player.getX() + this.distance * -Math.sin(yaw);
        const z = Player.getZ() + this.distance * Math.cos(yaw);

        if (isNaN(x) || isNaN(z)) return;
    
        Player.getPlayer().func_70107_b(x, Player.getY(), z);

        this.activated = true;
        SecretThing.secretClicked = false;
        this.args.clearDelayTimer();
    }

}