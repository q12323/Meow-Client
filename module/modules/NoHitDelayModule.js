import { McUtils } from "../../utils/McUtils";
import { Module } from "../Module";

const mc = McUtils.mc;
const leftClickCounter = mc.getClass().getDeclaredField("field_71429_W");
leftClickCounter.setAccessible(true);

export class NoHitDelayModule extends Module {

    constructor() {
        super("NoHitDelay", true, 0, true);

        this.triggers.add(register("tick", () => this.onTick()));
    }

    onTick() {
        if (!this.isToggled()) return;
        leftClickCounter.setInt(mc, 0);

    }

}