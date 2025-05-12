import { McUtils } from "../../../../utils/McUtils";
import { RoomUtils } from "../../../../utils/RoomUtils";
import { SecretThing } from "../SecretThing";

export class RouteArguments {

    static BlockArgument;

    awaitSecret = false;
    delay = 0;
    odinTransform = false;
    block = null;
    
    constructor(args) {
        this.setFromJsonObject(args);

        this.delayTimer = -1;
    }

    clearDelayTimer() {
        this.delayTimer = -1;
    }

    startDelay() {
        if (this.delayTimer === -1 && !(this.awaitSecret && !SecretThing.secretClicked)) this.delayTimer = Date.now();
    }

    canExecute() {
        if (this.delayTimer + this.delay > Date.now()) return false;
        if (this.awaitSecret && !SecretThing.secretClicked) return false;
        if (this.block && !this.block.canExecute()) return false;
        return true;
    }

    setFromJsonObject(json) {
        if (json.await_secret) this.awaitSecret = true;
        const delay = Number(json.delay);
        if (!isNaN(delay)) this.delay = delay;
        if (json.odin_transform) this.odinTransform = true;
        if (json.block) {
            try {
                this.block = new BlockArgument(json.block);
            } catch (e) {
                console.log(`error in parsing block argument: ${e}`);
                this.block = null;
            }
        }
    }

    getJsonObject() {
        const obj = {};
        if (this.awaitSecret) obj.await_secret = true;
        if (this.delay) obj.delay = this.delay;
        if (this.odinTransform) obj.odin_transform = true;
        if (this.block) obj.block = this.block.getJsonObject();
        return obj;
    }

}

class BlockArgument {
    constructor(json) {
        this.x = Number(json.x);
        this.y = Number(json.y);
        this.z = Number(json.z);
        this.id = Number(json.id);
        this.meta = Number(json.meta);
        if ([this.x, this.y, this.z, this.id, this.meta].some(d => isNaN(d))) throw new Error("one of them is not a number");
    }

    canExecute() {
        const realPos = RoomUtils.getRealBlockPos(new BlockPos(this.x, this.y, this.z).toMCBlock());
        const block = McUtils.getBlock(realPos);
        return block.getType().getID() === this.id && block.getMetadata() === this.meta;
    }

    getJsonObject() {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            id: this.id,
            meta: this.meta
        };
    }
}

RouteArguments.BlockArgument = BlockArgument;
