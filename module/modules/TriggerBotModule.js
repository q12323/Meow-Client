import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { Scheduler } from "../../utils/Scheduler";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const mc = McUtils.mc;
const BlockStoneBrick = Java.type("net.minecraft.block.BlockStoneBrick");

export class TriggerBotModule extends Module {

    static boom = new PropertyBoolean("boom", true);
    static delay = new PropertyInteger("delay", 500, 50, 2000);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {
        super("TriggerBot", false, 0, false);
        this.lastClick = Date.now();

        this.triggers.add(register("Tick", () => this.onTick()).unregister());
    }

    onTick() {
        if (!this.isToggled()) return;
        if (TriggerBotModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (mc.field_71462_r) return;
        const now = Date.now();
        if (now - this.lastClick < TriggerBotModule.delay.getValue()) return;
        const prev = mc.field_71476_x;
        mc.field_71460_t.func_78473_a(1);
        const mouseOver = mc.field_71476_x;
        mc.field_71476_x = prev;
        if (!mouseOver) return;

        if (mouseOver.field_72313_a.toString() === "BLOCK" && TriggerBotModule.boom.getValue()) {

            const blockPos = mouseOver.func_178782_a();
            const blockState = World.getWorld().func_180495_p(blockPos);
            if (this.isBoomable(blockState)) {
                const items = Player.getInventory().getItems();
                let index = -1;
                for (let i = 0; i < 9; i++) {
                    if (this.isBoom(items[i])) {
                        index = i;
                        break;
                    }
                }
                if (index === -1) return;
                const prevSlot = Player.getHeldItemIndex();
                KeyBindingUtils.pressHotbar(index);
                Scheduler.schedulePostTickTask(() => {
                    KeyBindingUtils.pressHotbar(prevSlot);
                    KeyBindingUtils.setLeftClick(true);
                    KeyBindingUtils.setLeftClick(false);
                });
            
                this.lastClick = now;
            }
        }
    }

    isBoom(ctItem) {
        if (!ctItem) return false;
        if (ctItem.getName().includes("boom")) return true;
        return false;
    }

    isBoomable(blockState) {
        const block = blockState.func_177230_c();
        if (block instanceof BlockStoneBrick) {
            const meta = block.func_176201_c(blockState);
            // if (meta === 2) ChatLib.chat("boomable!!")
            return meta === 2;
        }
        return false;
    }
}