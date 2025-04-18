import { McUtils } from "../../../utils/McUtils";

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
const SecretPickupEvent = Java.type("me.odinmain.events.impl.SecretPickupEvent");
//const MimicKilledEvent = Java.type("me.odinmain.features.impl.dungeon.mimicKilled");
const RoomEnterEvent = Java.type("me.odinmain.events.impl.RoomEnterEvent");

export const SecretThing = new class {
    constructor() {
        this.isFake = false;
        this.secretClicked = false;
        this.isListening = false;

        this.lastC08 = 0;
        this.c08SendDelay = 200;

        this.registerTrapChest = false;

        this.secretListener = register("PacketSent", (packet, event) => {
            if (event.isCanceled()) return;
            if (this.isFake) {
                this.isFake = false;
                return;
            }

            this.lastC08 = Date.now();

            const blockId = World.getBlockAt(new BlockPos(packet.func_179724_a())).type.getID();
            if (blockId === 144 || blockId === 54 || blockId === 69 || (this.registerTrapChest && blockId === 146)) {
                this.secretClicked = true;
            }

        }).setFilteredClass(C08PacketPlayerBlockPlacement).unregister();

        this.itemSecretListener = register(SecretPickupEvent.Item, () => {
            this.secretClicked = true;
        }).unregister();

        this.batSecretListener = register(SecretPickupEvent.Bat, () => {
            this.secretClicked = true;
        }).unregister();

        
        //Might be add Code about chest removal here

        //Detect Chest with C08PacketPlayerBlockPlacement

        //this.mimickillListner = register(MimicKilledEvent, () => {
        //    this.secretClicked = true;
        //})

        this.secretResetTrigger = register(RoomEnterEvent, (event) => {
            this.secretClicked = false;
        }).unregister();
    }

    register() {
        if (this.isListening) return; 
        this.secretListener.register();
        this.itemSecretListener.register();
        this.batSecretListener.register();
        this.secretResetTrigger.register();
        this.isFake = false;
        this.clicked = 0;
        this.secretClicked = false;
        this.isListening = true;
    }

    unregister() {
        if (!this.isListening) return;
        this.secretResetTrigger.unregister();
        this.batSecretListener.unregister();
        this.itemSecretListener.unregister();
        this.secretListener.unregister();
        this.isListening = false;
    }

    sendUseItem() {
        this.isFake = true;
        McUtils.sendUseItem();
    }
    
    canSendC08() {
        return Date.now() - this.lastC08 > this.c08SendDelay;
    }

}
