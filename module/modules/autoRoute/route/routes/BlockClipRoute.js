import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";

const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding");

export class BlockClipRoute extends Route {
    constructor(room, x, y, z, awaitSecret, yaw, pitch) {
        super("block_clip", room, x, y, z, awaitSecret, 1);
        this.yaw = Number(yaw);
        this.pitch = Number(pitch);
        if (isNaN(this.yaw) || isNaN(this.pitch)) throw new Error("value is not valid");
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.yaw = this.yaw;
        obj.data.pitch = this.pitch
        return obj;
    }

    run() {
        const player = Player.getPlayer();
        const gameSettings = Client.getMinecraft().field_71474_y;
        
        const handleKeys = () => {
            const keys = [
                gameSettings.field_74351_w.func_151463_i(),
                gameSettings.field_74370_x.func_151463_i(),
                gameSettings.field_74366_z.func_151463_i(),
                gameSettings.field_74368_y.func_151463_i() 
            ];
            
            keys.forEach(key => KeyBinding.func_74510_a(key, false));
            
            Client.scheduleTask(() => {
                keys.forEach(key => KeyBinding.func_74510_a(key, Keyboard.isKeyDown(key)));
            });
        };

        if (this.awaitSecret && !SecretThing.secretClicked) return;
        

        const currentZ = Player.getZ();
        const offset = 0.0624; 

        if (isWithinTolerence(currentZ, this.z - offset)) {
            player.func_70107_b(this.x, this.y, this.z - offset);
            Client.scheduleTask(() => player.func_70107_b(this.x, this.y, this.z + offset));
            handleKeys();
        }
        else if (isWithinTolerence(currentZ, this.z + offset)) {
            player.func_70107_b(this.x, this.y, this.z - offset);
            Client.scheduleTask(() => player.func_70107_b(this.x, this.y, this.z - offset * 3));
            handleKeys();
        }
    }

}