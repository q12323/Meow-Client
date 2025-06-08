import { HotbarSwapper } from "../../../utils/HotbarSwapper";
import { McUtils } from "../../../utils/McUtils";
import { Scheduler } from "../../../utils/Scheduler";
import { SkyblockUtils } from "../../../utils/SkyblockUtils";

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const SecretPickupEvent = Java.type("me.odinmain.events.impl.SecretPickupEvent");
//const DungeonUtils = Java.type("import me.odinmain.utils.skyblock.dungeon.DungeonUtils");
const RoomEnterEvent = Java.type("me.odinmain.events.impl.RoomEnterEvent");
const C09PacketHeldItemChange = Java.type("net.minecraft.network.play.client.C09PacketHeldItemChange");
const MCItemStack = Java.type("net.minecraft.item.ItemStack");

// if (!DungeonUtils.mimicKilled) 

export const SecretThing = new class {
    constructor() {
        this.secretClicked = 0;
        this.isListening = false;
        this.registerTrapChest = false;

        this.didTickPassed = true;
        this.lastC08 = 0;
        this.c08SendDelay = 200;
        this.didMatched = false;

        this.secretListener = register("PacketSent", (packet, event) => {
            if (event.isCanceled()) return;

            this.lastC08 = Date.now();
            this.didTickPassed = false;
            Scheduler.scheduleLowestPostTickTask(() => {
                this.didTickPassed = true;
            })
            
            const dir = packet.func_149568_f();
            if (dir === 255) {
                this.didMatched = true;
                return;
            }
            this.didMatched = false;

            const blockId = World.getBlockAt(new BlockPos(packet.func_179724_a())).type.getID();
            if (blockId === 144 || blockId === 54 || blockId === 69 || (this.registerTrapChest && blockId === 146)) {
                ++this.secretClicked;
                Scheduler.schedulePostTickTask(() => {
                    if (!this.didMatched && SkyblockUtils.isInSkyblock()) {
                        const itemStack = packet.func_149574_g();
                        const synced = Player.getInventory().getItems()[HotbarSwapper.getCurrentPlayerItem()].getItemStack();
                        if (!MCItemStack.func_77989_b(synced, itemStack)) return;
                        Client.sendPacket(new C08PacketPlayerBlockPlacement(packet.func_149574_g()));
                        this.didMatched = true;
                    }
                }, 0, -10)
            }

        }).setFilteredClass(C08PacketPlayerBlockPlacement).unregister();

        this.c09Trigger = register("PacketSent", () => {
            this.didMatched = true;
        }).setFilteredClass(C09PacketHeldItemChange).unregister();

        this.itemSecretListener = register(SecretPickupEvent.Item, () => {
            ++this.secretClicked;
        }).unregister();

        this.batSecretListener = register(SecretPickupEvent.Bat, () => {
            ++this.secretClicked;
        }).unregister();

        
        //Might be add Code about chest removal here

        //Detect Chest with C08PacketPlayerBlockPlacement

        //this.mimickillListner = register(MimicKilledEvent, () => {
        //    ++this.secretClicked;
        //})

        this.secretResetTrigger = register(RoomEnterEvent, (event) => {
            this.secretClicked = 0;
        }).unregister();
    }

    register() {
        if (this.isListening) return; 
        this.secretListener.register();
        this.itemSecretListener.register();
        this.batSecretListener.register();
        this.secretResetTrigger.register();
        this.c09Trigger.register();
        this.clicked = 0;
        this.secretClicked = 0;
        this.isListening = true;
    }

    unregister() {
        if (!this.isListening) return;
        this.c09Trigger.unregister();
        this.secretResetTrigger.unregister();
        this.batSecretListener.unregister();
        this.itemSecretListener.unregister();
        this.secretListener.unregister();
        this.isListening = false;
    }

    sendUseItem() {
        McUtils.sendUseItem();
    }
    
    canSendC08() { // TODO: rename
        return this.didMatched ? this.didTickPassed : Date.now() - this.lastC08 > this.c08SendDelay;
    }

    canSendPlaceC08() {
        return this.didTickPassed;
    }

}
