import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { ItemUtils } from "../../utils/ItemUtils";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { WeaponManager } from "../../weapon/WeaponManager";
import { Module } from "../Module";

const Mouse = Java.type("org.lwjgl.input.Mouse");

export class AutoClickerModule extends Module {
    
    static minCps = new PropertyInteger("min-cps", 8, 1, 20);
    static maxCps = new PropertyInteger("max-cps", 12, 1, 20);
    static weaponsOnly = new PropertyBoolean("weapons-only", true);
    static UUIDsOnly = new PropertyBoolean("uuids-only", true);
    static breakBlocks = new PropertyBoolean("break-blocks", true);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);
    
    constructor() {
        super("AutoClicker", false, 0, false);

        this.randomCps = 0;
        this.lastClick = 0;
        this.state = false;
        this.pressed = false;

        AutoClickerModule.minCps.onProperty((value) => {
            if (value > AutoClickerModule.maxCps.getValue()) {
                AutoClickerModule.maxCps.setValue(value);
            }
        });
        AutoClickerModule.maxCps.onProperty((value) => {
            if (value < AutoClickerModule.minCps.getValue()) {
                AutoClickerModule.minCps.setValue(value);
            }
        })

        this.triggers.add(register("Step", () => this.onStep()).unregister());
    }

    setToggled(toggled) {
        super.setToggled(toggled);
    }

    onStep() {
        if (!this.isToggled()) return;
        if (AutoClickerModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        Mouse.poll();

        if (Mouse.isButtonDown(0)) {
            if (this.state) {
                this.pressed = false;
            } else {
                this.pressed = true;
            }
            this.state = true;
        } else this.state = false;

        const ms = Date.now();

        if (this.pressed) {
            this.setRandomCps();
            this.lastClick = ms;
            return;
        }
        
        const cps = this.getRandomCps();

        if (ms - this.lastClick >= 1000 / cps) {
            if (this.canClick()) {
                KeyBindingUtils.setLeftClick(false);
                KeyBindingUtils.setLeftClick(true);
            }
            this.lastClick += 1000 / cps;
            if (this.lastClick > ms) this.lastClick = ms;
            this.setRandomCps();
        }
    }

    canClick() {
        Mouse.poll();
        if (!Mouse.isButtonDown(0)) return false;
        if (McUtils.mc.field_71476_x === null) return false;
        if (McUtils.mc.field_71476_x.field_72313_a === null) return false;
        if (McUtils.mc.field_71462_r !== null) return false;
        if (!this.isHoldingWeapon()) return false;
        if ((AutoClickerModule.breakBlocks.getValue() && McUtils.mc.field_71476_x.field_72313_a == "BLOCK")) return false;
        return true;
        
    }

    // thanks chatgpt!
    isHoldingWeapon() {
        const heldItem = ItemUtils.getHeldItem();
        return (
            (!AutoClickerModule.weaponsOnly.getValue() && !AutoClickerModule.UUIDsOnly.getValue()) ||
            (AutoClickerModule.weaponsOnly.getValue() && WeaponManager.isWeapon(heldItem)) ||
            (AutoClickerModule.UUIDsOnly.getValue() && WeaponManager.isUUIDWeapon(heldItem))
        );
    }
    

    setRandomCps() {
        this.randomCps = AutoClickerModule.minCps.getValue() + Math.random() * (AutoClickerModule.maxCps.getValue() - AutoClickerModule.minCps.getValue());
    }

    getRandomCps() {
        return this.randomCps;
    }

    getSuffix() {
        return AutoClickerModule.minCps.getValue() === AutoClickerModule.maxCps.getValue() ? [String(AutoClickerModule.minCps.getValue())] : [`${AutoClickerModule.minCps.getValue()}-${AutoClickerModule.maxCps.getValue()}`];
    }
}