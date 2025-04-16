import { RenderUtils } from "../../../../utils/RenderUtils";
import { RoomUtils } from "../../../../utils/RoomUtils";
import { SecretThing } from "../SecretThing";
import { Routes } from "./RoutesList";

// need to handle command and json
export class Route {

    constructor(type, room, x, y, z, awaitSecret, priority = 0) {
        this.type = String(type);
        this.room = String(room);
        this.x = Number(x);
        this.y = Number(y);
        this.z = Number(z);
        this.priority = priority;
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.z)) throw new Error("value is not valid");
        this.awaitSecret = String(awaitSecret).toLowerCase() === "true" ? true : false;
        this.deleted = false;
        this.reset();
        this.add();
        // console.log([this.x, this.y, this.z].join(", "));
    }

    add() {
        Routes.add(this);
    }

    delete() {
        this.deleted = true;
        Routes.delete(this);
    }

    getDistance() {
        const crds = RoomUtils.getRealCoords(this.x, this.y, this.z);
        return Math.sqrt((Player.getX() - crds[0]) ** 2 + (Player.getY() - crds[1]) ** 2 + (Player.getZ() - crds[2]) ** 2);
    }

    run() {

    }

    doRender(depth, color) {
        const coords = RoomUtils.getRealCoords(this.x, this.y, this.z);
        const x = coords[0] - Player.getRenderX();
        const y = coords[1] - Player.getRenderY();
        const z = coords[2] - Player.getRenderZ();
        GlStateManager.func_179094_E(); // pushMatrix
        if (!depth) GlStateManager.func_179097_i(); // disableDepth
        GlStateManager.func_179137_b(x, y + 0.05, z);
        GlStateManager.func_179114_b(90, 1, 0, 0);
        RenderUtils.drawCircle(0.6, color, 30, 3);
        if (!depth) GlStateManager.func_179126_j(); // enableDepth
        GlStateManager.func_179121_F(); // popMatrix
        return coords;
    }

    reset() {
        this.activated = false;
    }

    swingReset() {
        if (this.awaitSecret) {
            SecretThing.secretClicked = true;
        }
        this.activated = false;
    }

    // idk
    // static addFromJsonObject(json) {
    //     new this(json.type, json.room, json.x, json.y, json.z, json.await_secret);
    // }

    getJsonObject() {
        return {
            room: this.room,
            type: this.type,
            x: this.x,
            y: this.y,
            z: this.z,
            await_secret: this.awaitSecret,
            data: {}
        };
    }
}
