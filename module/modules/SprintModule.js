import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { Module } from "../Module";

const mc = McUtils.mc;

export class SprintModule extends Module {
    constructor() {
        super("Sprint", false, 0, true);

        this.triggers.add(register("Tick", () => this.onTick()));
    }

    onTick() {
        if (!this.isToggled()) return;
        KeyBindingUtils.setKeyState(KeyBindingUtils.gameSettings.field_151444_V.func_151463_i(), true);
    }
}