import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { McUtils } from "../../utils/McUtils";
import { Module } from "../Module"

const mc = McUtils.mc;
const ItemFishingRod = Java.type("net.minecraft.item.ItemFishingRod");
const ItemBlock = Java.type("net.minecraft.item.ItemBlock");

export class FastPlaceModule extends Module {

    static delay = new PropertyInteger("delay", 1, 0, 4);
    static blocksOnly = new PropertyBoolean("blocks-only", true);

    constructor() {
        super("FastPlace", false, 0, false);

        // this.delay = new PropertyInteger("delay", 0, 0, 4);
        // this.blocksOnly = new PropertyBoolean("blocks-only", true);

        // this.rightClickDelay = FastPlaceModule.delay.getValue();

        this.triggers.add(register("Tick", () => this.onTick()).unregister());
    }

    onTick() {
        if (!this.isToggled()) return;
        if (!this.canFastPlace()) return;
        if (FastPlaceModule.delay.getValue() === 0) {
            McUtils.setRightClickDelayTimer(0);
        } else if (McUtils.getRightClickDelayTimer() === 3) {
            McUtils.setRightClickDelayTimer(FastPlaceModule.delay.getValue() - 1);
        }
        
    }

    canFastPlace() {
        const itemStack = mc.field_71439_g.func_70694_bm();
        if (itemStack !== null) {
            const item = itemStack.func_77973_b();
            if (item instanceof ItemFishingRod) return false;
            if (item instanceof ItemBlock) return true;
        }
        return !FastPlaceModule.blocksOnly.getValue();
    }

    getSuffix() {
        return [FastPlaceModule.delay.getValue()];
    }
}
