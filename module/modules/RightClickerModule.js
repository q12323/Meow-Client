import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const Mouse = Java.type("org.lwjgl.input.Mouse");

export class RightClickerModule extends Module {

    static minCps = new PropertyInteger("min-cps", 10, 0, 20);
    static maxCps = new PropertyInteger("max-cps", 10, 0, 20);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {
        super("RightClicker", false, 0, false);

        this.randomCps = 0;
        this.lastClick = 0;
        this.state = false;
        this.pressed = false;

        RightClickerModule.minCps.onProperty((value) => {
            if (value > RightClickerModule.maxCps.getValue()) {
                RightClickerModule.maxCps.setValue(value);
            }
        });
        RightClickerModule.maxCps.onProperty((value) => {
            if (value < RightClickerModule.minCps.getValue()) {
                RightClickerModule.minCps.setValue(value);
            }
        });

        this.triggers.add(register("Tick", () => this.onTick()).unregister());

    }

    setToggled(toggled) {
        super.setToggled(toggled);
    }

    onTick() {
        if (!this.isToggled()) return;
        if (RightClickerModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;

        const ms = Date.now();

        if (Mouse.isButtonDown(1)) {
            if (this.state) {
                this.pressed = false;
            } else {
                this.pressed = true;
            }
            this.state = true;
        } else this.state = false;

        if (this.pressed) {
            this.setRandomCps();
            this.lastClick = ms;
            return;
        }

        const cps = this.getRandomCps();
        McUtils.setRightClickDelayTimer(4);

        if (ms - this.lastClick >= 1000 / cps) {
            if (this.canClick()) {
                KeyBindingUtils.setRightClick(true);
                KeyBindingUtils.setRightClick(false);
            }
            this.lastClick += 1000 / cps;
            if (this.lastClick > ms) this.lastClick = ms;
            this.setRandomCps();
        }
    }

    canClick() {
        if (!Mouse.isButtonDown(1)) return false;
        if (McUtils.mc.field_71462_r !== null) return false;
        return true;
    }

    setRandomCps() {
        this.randomCps = RightClickerModule.minCps.getValue() + Math.random() * (RightClickerModule.maxCps.getValue() - RightClickerModule.minCps.getValue());
    }

    getRandomCps() {
        return this.randomCps;
    }
    
    getSuffix() {
        return RightClickerModule.minCps.getValue() === RightClickerModule.maxCps.getValue() ? [String(RightClickerModule.minCps.getValue())] : [`${RightClickerModule.minCps.getValue()}-${RightClickerModule.maxCps.getValue()}`];
    }
}