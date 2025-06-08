import { ChatUtils } from "../../../../../utils/ChatUtils";
import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";
import { McUtils } from "../../../../../utils/McUtils";
import { Scheduler } from "../../../../../utils/Scheduler";
import { SecretThing } from "../../SecretThing";
import { Ticker } from "../../Ticker";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

export class PearlClipRoute extends Route {
    constructor(room, x, y, z, args, distance) {
        super("pearl_clip", room, x, y, z, args, 0);
        this.distance = Number(distance);
        if (isNaN(this.distance)) {
            this.delete();
            throw new Error("value is not valid");
        }
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.distance = this.distance;
        return obj;
    }

    run() {
        let index = -1;
        try {
            const items = Player.getInventory().getItems();
            for (let i = 0; i < 9; i++) {
                if (items[i]?.getID() === 368 && items[i]?.getName() !== "Spirit Leap") {
                    index = i;
                    break;
                }
            }
        } catch (error) {
            console.log("error while finding item in hotbar: " + error);
            index = -1;
        }

        if (index === -1) {
            ChatUtils.prefixChat(`AutoRoute: no ender pearl in your hotbar!`);
            this.activated = true;
            return;
        }
        
        this.args.startDelay();
        SilentRotationHandler.doSilentRotation();
        McUtils.setAngles((Ticker.getTick() % 2 * 2 - 1) * 1e-6, 90 - Player.getPitch());


        const playerState = {
            yaw: Player.getRawYaw(),
            pitch: Player.getPitch()
        };

        Scheduler.schedulePostTickTask(() => {
            if (!this.args.canExecute()) return;
    
            const isHoldingPearl = Player.getHeldItemIndex() === index;
            if (!isHoldingPearl) {
                const result = HotbarSwapper.changeHotbar(index);
                if (!result) return;
            }
            if (!SecretThing.canSendC08()) return;
            SecretThing.sendUseItem();
            this.activated = true;
            SecretThing.secretClicked = 0;
            this.args.clearDelayTimer();

            playerState.x = Player.getX();
            playerState.y = Player.getY();
            playerState.z = Player.getZ();

            const timeClicked = Date.now();
            const pearlClipListener = (packet, event) => {
                if (timeClicked + 20000 < Date.now()) return;

                if (!event.isCanceled()) {
                    let x = packet.func_148932_c();
                    let y = packet.func_148928_d();
                    let z = packet.func_148933_e();
                    let yaw = packet.func_148931_f();
                    let pitch = packet.func_148930_g();
                    const flag = packet.func_179834_f();

                    if (flag.includes(S08PacketPlayerPosLook.EnumFlags.X)) {
                        x += Player.getX();
                    }
            
                    if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Y)) {
                        y += Player.getY();
                    }
            
                    if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Z)) {
                        z += Player.getZ();
                    }

                    if (flag.includes(S08PacketPlayerPosLook.EnumFlags.X_ROT)) {
                        pitch = playerState.pitch;
                    }
            
                    if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Y_ROT)) {
                        yaw = playerState.yaw;
                    }

                    const isPearlS08 = Math.abs(x - playerState.x) <= 1 &&
                        Math.abs(z - playerState.z) <= 1 &&
                        y - playerState.y > 0 &&
                        y - playerState.y < 3;

                        // ChatLib.chat(isPearlS08);
                        // ChatLib.chat(`x: ${x} ${playerState.x}`);
                        // ChatLib.chat(`y: ${y} ${playerState.y}`);
                        // ChatLib.chat(`z: ${z} ${playerState.z}`);
                        // ChatLib.chat(`yaw: ${yaw} ${playerState.yaw}`);

                    if (isPearlS08) {
                        Scheduler.schedulePreTickTask(() => {
                            // ChatLib.chat("pre: " + Date.now())
                            if (isNaN(this.distance)) return;
                            Player.getPlayer().func_70107_b(x, this.y - this.distance + 1, z);
                            // ChatLib.chat(`clip! ${x} ${this.y - this.distance - 1} ${z}`);
                            // ChatLib.chat(`clipped: ${Player.getX()} ${Player.getY()} ${Player.getZ()}`);
                            // Scheduler.schedulePostTickTask(() => {
                            //     ChatLib.chat(`posttick: ${Player.getX()} ${Player.getY()} ${Player.getZ()}`)
                            // })
                        })
                        return;
                    }
                }
                Scheduler.scheduleLowS08Task(pearlClipListener, 1);
            }

            Scheduler.scheduleLowS08Task(pearlClipListener);
        })

    }

}
