import { ItemUtils } from "../../../../../utils/ItemUtils";
import { KeyBindingUtils } from "../../../../../utils/KeyBindingUtils";
import { AotvRoute } from "./AotvRoute";

export class HypeRoute extends AotvRoute {
    constructor(room, x, y, z, awaitSecret, yaw, pitch, targetX, targetY, targetZ) {
        super(room, x, y, z, awaitSecret, yaw, pitch, targetX, targetY, targetZ);
        this.type = "hype";
        this.name = "hyperion";
    }

    checkAndChangeHotbar(index) {
        if (!this.isRouteItem()) {
            KeyBindingUtils.pressHotbar(index);
            return false;
        }
        return true;
    }
    
    isRouteItem(item = ItemUtils.getHeldItem()) {
        try {
            const scrolls = item?.getNBT()?.toObject()?.tag?.ExtraAttributes?.ability_scroll;
            if (!Array.isArray(scrolls)) return false;
            if (scrolls.includes("IMPLOSION_SCROLL") && scrolls.includes("WITHER_SHIELD_SCROLL") && scrolls.includes("SHADOW_WARP_SCROLL")) {
                return true;
            }
        } catch (error) {}

        return false;
    }
}
