import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { ItemUtils } from "../../utils/ItemUtils";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { WeaponManager } from "../../weapon/WeaponManager";
import { Module } from "../Module";

const MovingObjectType = Java.type("net.minecraft.util.MovingObjectPosition$MovingObjectType");
const Mouse = Java.type("org.lwjgl.input.Mouse");
const PlayerControllerMP = Java.type("net.minecraft.client.multiplayer.PlayerControllerMP");
const mc = McUtils.mc;

const isHittingBlockField = PlayerControllerMP.class.getDeclaredField("field_78778_j");
isHittingBlockField.setAccessible(true);

export class AutoClickerModule extends Module {
    
    static minCps = new PropertyInteger("min-cps", 8, 1, 20);
    static maxCps = new PropertyInteger("max-cps", 12, 1, 20);
    static weaponsOnly = new PropertyBoolean("weapons-only", true);
    static UUIDsOnly = new PropertyBoolean("uuids-only", true);
    static breakBlocks = new PropertyBoolean("break-blocks", true);
    static breakBlocksDelay = new PropertyInteger("break-blocks-delay", 1, 0, 20);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);
    
    constructor() {
        super("AutoClicker", false, 0, false);

        this.randomCps = 0;
        this.lastClick = 0;
        this.buttonDown = false;
        this.ticksOverBlock = 0;

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

        this.triggers.add(register("Tick", () => this.onTick()).unregister());
        this.triggers.add(register("RenderWorld", () => this.onRenderWorld()).unregister());
    }

    setToggled(toggled) {
        super.setToggled(toggled);
        if (toggled) {
            this.ticksOverBlock = 0;
            this.setRandomCps();
        } else {
            if (!this.buttonDown) {
                Mouse.poll();
                if (Mouse.isButtonDown(0)) {
                    KeyBindingUtils.setLeftClick(true);
                }

                this.buttonDown = true;
            }
        }
    }

    onTick() {
        if (!this.isToggled()) return;
        if (mc.field_71439_g.field_70173_aa % 5 === 0) {
            this.setRandomCps();
        }

        if (mc.field_71476_x !== null && mc.field_71476_x.field_72313_a === MovingObjectType.BLOCK) {
            ++this.ticksOverBlock;
        } else {
            this.ticksOverBlock = 0;
        }
    }

    onRenderWorld() {
        if (!this.isToggled()) return;
        if (AutoClickerModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (mc.field_71439_g === null || mc.field_71441_e === null || mc.field_71462_r !== null) return;
        
        Mouse.poll();
        if (Mouse.isButtonDown(0)) {
            const cps = this.getRandomCps();
            const ms = Date.now();
            if (this.canClick()) {
                if (this.lastClick + 1000 / cps <= ms) {
                    this.lastClick = ms;
                    KeyBindingUtils.setLeftClick(true);
                    this.buttonDown = true;
                } else if (this.lastClick + 500 / cps <= ms) {
                    KeyBindingUtils.setLeftClick(false);
                    this.buttonDown = false;
                }
            } else if (!this.buttonDown) {
                KeyBindingUtils.setLeftClick(true);
                this.buttonDown = true;
            }
        } else if (!this.buttonDown) {
            this.buttonDown = true;
        }
    }

    canClick() {
        if (!this.isHoldingWeapon()) {
            return false;
        } else if (AutoClickerModule.breakBlocks.getValue() && this.ticksOverBlock > AutoClickerModule.breakBlocksDelay.getValue()) {
            return !isHittingBlockField.get(mc.field_71442_b);
        }
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