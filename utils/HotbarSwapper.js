import { McUtils } from "./McUtils";
import { Scheduler } from "./Scheduler";
import { KeyBindingUtils } from "./KeyBindingUtils";

const PlayerControllerMP = Java.type("net.minecraft.client.multiplayer.PlayerControllerMP");
const currentPlayerItemField = PlayerControllerMP.class.getDeclaredField("field_78777_l");
currentPlayerItemField.setAccessible(true);

const C09PacketHeldItemChange = Java.type("net.minecraft.network.play.client.C09PacketHeldItemChange");

const mc = McUtils.mc;

export const HotbarSwapper = new class {
    constructor() {
        this.didSentChangePacket = false;

        const onLowestPostTick = () => {
            this.didSentChangePacket = false;
            Scheduler.scheduleLowestPostTickTask(() => onLowestPostTick(), 1, -100);
        };
        onLowestPostTick();
        this.c09PacketSent = register("PacketSent", () => this.onHeldItemChangePacket()).setFilteredClass(C09PacketHeldItemChange);
    }

    /**
     * this SHOULD call after keybinding process
     * try to change hotbar and sync instantly
     * or change next tick
     * @param {Int} index hotbar index 
     * @returns did change instantly
     */
    changeHotbar(index) {
        if (isNaN(index)) return false;
        if (index === Player.getHeldItemIndex() && this.getCurrentPlayerItem() === index) return true;
        if (this.didSentChangePacket) {
            KeyBindingUtils.pressHotbar(index);
            return false;
        }
        
        Player.setHeldItemIndex(index);
        this.syncCurrentPlayItem();
        return true;
    }

    onHeldItemChangePacket() {
        this.didSentChangePacket = true;
    }

    getCurrentPlayerItem() {
        return currentPlayerItemField.get(mc.field_71442_b);
    }

    syncCurrentPlayItem() {
        McUtils.syncCurrentPlayItem();
    }

}