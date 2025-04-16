import { ChatUtils } from "../../../../../utils/ChatUtils";
import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";
import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { Scheduler } from "../../../../../utils/Scheduler";
import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";

const EntityBat = Java.type("net.minecraft.entity.passive.EntityBat");

export class BatRoute extends Route {
    constructor(room, x, y, z, awaitSecret, yaw, pitch) {
        super("bat", room, x, y, z, awaitSecret, 2);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        if (isNaN(this.yaw) || isNaN(this.pitch)) throw new Error("value is not valid");
        this.forceBat = false;
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch
        return obj;
    }

    run() {
        let index = -1;
        let item = null;
        try {
            const items = Player.getInventory().getItems();
            for (let i = 0; i < 9; i++) {
                item = items[i];
                let scrolls = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.ability_scroll;
                if (!Array.isArray(scrolls)) continue;
                if (scrolls.includes("IMPLOSION_SCROLL") && scrolls.includes("WITHER_SHIELD_SCROLL") && scrolls.includes("SHADOW_WARP_SCROLL")) {
                    index = i;
                    break;
                }
            }
        } catch (error) {
            console.log("error while finding item in hotbar: " + error);
            index = -1;
        }

        if (index === -1) {
            ChatUtils.prefixChat(`AutoRoute: no wither impact weapon in your hotbar!`);
            this.activated = true;
            return;
        }

        const yaw = RoomUtils.getRealYaw(this.yaw);
        const pitch = this.pitch;

        const rotations = McUtils.getRotations(yaw, pitch);
        SilentRotationHandler.doSilentRotation();
        McUtils.setAngles(rotations[0], rotations[1]);

        if (this.awaitSecret && !SecretThing.secretClicked) return;
        if (!this.isBatInRange() && !this.forceBat) return;

        const isHoldingItem = Player.getHeldItemIndex() === index;
        if (!isHoldingItem) {
            const result = HotbarSwapper.changeHotbar(index);
            if (!result) return;
        }

        Scheduler.schedulePostTickTask(() => {
            if (!SecretThing.canSendC08()) return;
            SecretThing.sendUseItem();
            this.activated = true;
            SecretThing.secretClicked = false;
        });

    }

    isBatInRange() {
        const entities = World.getAllEntitiesOfType(EntityBat);
        const x = Player.getX();
        const y = Player.getY();
        const z = Player.getZ();
        for (let entity of entities) {
            let dist = McUtils.getDistance3D([x, y, z], [entity.getX(), entity.getY(), entity.getZ()]);
            if (dist < 20) return true;
        }
        return false;
    }

    reset() {
        super.reset();
        this.forceBat = false;
    }

    swingReset() {
        super.swingReset();
        this.forceBat = true;
    }
}