import { RenderUtils } from "../../../../utils/RenderUtils";
import { RoomUtils } from "../../../../utils/RoomUtils";
import { SecretThing } from "../SecretThing";
import { RouteArguments } from "./RouteArguments";
import { Routes } from "./RoutesList";

// need to handle command and json
export class Route {
    constructor(type, room, x, y, z, args, priority = 0) {
        this.type = String(type);
        this.room = String(room);
        this.x = Number(x);
        this.y = Number(y);
        this.z = Number(z);
        this.priority = priority;
        if (isNaN(this.x) || isNaN(this.y) || isNaN(this.z)) throw new Error("value is not valid");
        this.deleted = false;

        this.args = new RouteArguments(args);
        
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
        const crds = this.getRealCoords();
        return Math.sqrt((Player.getX() - crds[0]) ** 2 + (Player.getY() - crds[1]) ** 2 + (Player.getZ() - crds[2]) ** 2);
    }

    /**
     * @returns can run next
     */
    run() {

    }

    doRender(depth, color) {
        const coords = this.getRealCoords();
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
        this.args.clearDelayTimer();
    }

    swingReset() {
        if (this.args.awaitSecret) {
            SecretThing.secretClicked = Number.MAX_VALUE;
        }
        this.activated = false;
        this.args.clearDelayTimer();
    }

    getRealCoords() {
        if (this.args.odinTransform) {
            const pos = RoomUtils.getRealBlockPos(new BlockPos(this.x, this.y, this.z).toMCBlock());
            return [pos.func_177958_n() + 0.5, pos.func_177956_o(), pos.func_177952_p() + 0.5];
        } else {
            return RoomUtils.getRealCoords(this.x, this.y, this.z);
        }
    }

    getJsonObject() {
        const obj =  {
            room: this.room,
            type: this.type,
            x: this.x,
            y: this.y,
            z: this.z,
            args: this.args.getJsonObject(),
            data: {}
        };

        return obj;
    }

    
}
