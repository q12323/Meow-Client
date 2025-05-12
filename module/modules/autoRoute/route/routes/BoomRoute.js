import { ItemUtils } from "../../../../../utils/ItemUtils";
import { McUtils } from "../../../../../utils/McUtils";
import { RoomUtils } from "../../../../../utils/RoomUtils";
import { ChatUtils } from "../../../../../utils/ChatUtils";
import { Route } from "../Route";
import { SilentRotationHandler } from "../SilentRotationHandler";
import { Ticker } from "../../Ticker";
import { HotbarSwapper } from "../../../../../utils/HotbarSwapper";
import { SecretThing } from "../../SecretThing";

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");

export class BoomRoute extends Route {
    constructor(room, x, y, z, args, yaw, pitch) {
        super("boom", room, x, y, z, args, 3);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        if (isNaN(this.yaw) || isNaN(this.pitch)) {
            this.delete();
            throw new Error("value is not valid");
        }

    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch;
        return obj;
    }

    run() {
        let index = -1;
        try {
            const items = Player.getInventory().getItems();
            for (let i = 0; i < 9; i++) {
                if (this.isBoom(items[i])) {
                    index = i;
                    break;
                }
            }
        } catch (error) {
            console.log("error while finding superboom in hotbar: " + error);
            index = -1;
        }

        if (index === -1) {
            ChatUtils.prefixChat(`AutoRoute: No superboom item in your hotbar!`);
            this.activated = true;
            return;
        }
        this.args.startDelay();

        const yaw = RoomUtils.getRealYaw(this.yaw);
        const pitch = this.pitch;

        SilentRotationHandler.doSilentRotation();
        McUtils.rotate(yaw + (Ticker.getTick() % 2 * 2 - 1) * 1e-6, pitch);

        if (!this.args.canExecute()) return

        let look = Player.asPlayerMP().getLookVector(1);
        look = McUtils.getArrayFromVec3(look);
        look = McUtils.getVec3FromArray(look.map(c => c * 4.5));

        const eyePos = Player.asPlayerMP().getEyePosition(1);

        const mop = World.getWorld().func_147447_a(eyePos, eyePos.func_178787_e(look), false, false, true);
        if (!mop) return;

        const blockPos = mop.func_178782_a();
        const hitVec = mop.field_72307_f;

        const offsetX = hitVec.field_72450_a - blockPos.func_177958_n();
        const offsetY = hitVec.field_72448_b - blockPos.func_177956_o();
        const offsetZ = hitVec.field_72449_c - blockPos.func_177952_p();

        if (!this.isValidBlockOffset(offsetX) || !this.isValidBlockOffset(offsetY) || !this.isValidBlockOffset(offsetZ)) return;

        if (!this.isBoom()) {
            const result = HotbarSwapper.changeHotbar(index);
            if (!result) return;
        }
        
        if (!SecretThing.canSendPlaceC08()) return;
        McUtils.syncCurrentPlayItem();
        Client.sendPacket(
            new C08PacketPlayerBlockPlacement(
                blockPos,
                mop.field_178784_b.func_176745_a(),
                Player.getPlayer().field_71071_by.func_70448_g(),
                offsetX,
                offsetY,
                offsetZ
            )
        );

        this.activated = true;
        this.args.clearDelayTimer();
        return true;
    }

    isBoom(item = ItemUtils.getHeldItem()) {
        if (!item) return false;
        return item.getName().toLowerCase().includes("boom");
    }

    isValidBlockOffset(offset) {
        return offset >= 0 && offset <= 1;
    }
}
