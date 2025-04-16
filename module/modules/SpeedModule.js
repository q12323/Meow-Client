import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const MCEntityLivingBase = Java.type("net.minecraft.entity.EntityLivingBase");

const isJumpingField = MCEntityLivingBase.class.getDeclaredField("field_70703_bu");
const jumpTicksField = MCEntityLivingBase.class.getDeclaredField("field_70773_bE");

isJumpingField.setAccessible(true);
jumpTicksField.setAccessible(true);

export class SpeedModule extends Module {

    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {
        super("Speed", false, 0, false);

        this.triggers.add(register("Tick", () => this.onTick()).unregister());
    }

    onTick() {
        if (!this.isToggled()) return;
        if (SpeedModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        const Forward = KeyBindingUtils.gameSettings.field_74351_w;
        const Left = KeyBindingUtils.gameSettings.field_74370_x;
        const Back = KeyBindingUtils.gameSettings.field_74368_y;
        const Right = KeyBindingUtils.gameSettings.field_74366_z;
        const f = Forward.func_151470_d();
        const l = Left.func_151470_d();
        const b = Back.func_151470_d();
        const r = Right.func_151470_d();
        if (!f && !l  && !b && !r) return;
        const JumpKey = KeyBindingUtils.gameSettings.field_74314_A.func_151463_i();
        KeyBindingUtils.setKeyState(JumpKey, true);
        Client.scheduleTask(() => KeyBindingUtils.setKeyState(JumpKey, false))
        const thePlayer = Player.getPlayer();
        const isJumping = isJumpingField.get(thePlayer);
        const isInWater = thePlayer.func_180799_ab();
        const isInLava = thePlayer.func_180799_ab();
        const onGround = thePlayer.field_70122_E;
        const jumpTicks = jumpTicksField.get(thePlayer);
        if (jumpTicks > 2) {
            jumpTicksField.setInt(thePlayer, 2);
            return;
        }
        if (isInWater || isInLava || !onGround || jumpTicks > 1) {
            return;
        }
        const walkSpeed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806;
        // ChatLib.chat([KeyBindingUtils.isKeyDown(Forward.func_151463_i()), KeyBindingUtils.isKeyDown(Left.func_151463_i()), KeyBindingUtils.isKeyDown(Back.func_151463_i()), KeyBindingUtils.isKeyDown(Right.func_151463_i())].toString())
        const vec = [0, 0];
        if (f) {
            vec[1] += 1;
        }
    
        if (l) {
            vec[0] += 1;
        }
    
        if (b) {
            vec[1] -= 1;
        }
    
        if (r) {
            vec [0] -= 1;
        }
    
        const length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
    
        if (length === 0) return;
    
        const scalar = walkSpeed / length;
    
        vec[0] *= scalar;
        vec[1] *= scalar;
    
        const yaw = Player.getYaw() * Math.PI / 180;
    
        const sin = Math.sin(yaw);
        const cos = Math.cos(yaw);
    
        [vec[0], vec[1]] = [vec[0] * cos - vec[1] * sin, vec[0] * sin + vec[1] * cos];

        // if (Player.isSprinting()) {
        //     vec[0] += sin * 0.2;
        //     vec[1] -= cos * 0.2;
        // }
    
        if (!Player.isSprinting()) {
            vec[0] += vec[0] / walkSpeed * 0.2;
            vec[1] += vec[1] / walkSpeed * 0.2;
        }

        // thePlayer.func_70031_b(true);

        McUtils.setVelocity(vec[0], Player.getMotionY(), vec[1]);
    }
}