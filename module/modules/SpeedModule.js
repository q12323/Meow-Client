import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { Scheduler } from "../../utils/Scheduler";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const MCEntityLivingBase = Java.type("net.minecraft.entity.EntityLivingBase");
const LivingUpdateEvent = Java.type("net.minecraftforge.event.entity.living.LivingEvent$LivingUpdateEvent");
const LivingJumpEvent = Java.type("net.minecraftforge.event.entity.living.LivingEvent$LivingJumpEvent");

const jumpTicksField = MCEntityLivingBase.class.getDeclaredField("field_70773_bE");

jumpTicksField.setAccessible(true);

let airTicks = 0;
register("tick", () => {
    if (Player.asPlayerMP().isOnGround()) {
        airTicks = 0;
    } else {
        ++airTicks;
    }
})

export class SpeedModule extends Module {

    static autoJump = new PropertyBoolean("auto-jump", false);
    static enableOnce = new PropertyBoolean("enable-once", false);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {
        super("Speed", false, 0, false);

        this.movingDirection = null;

        this.triggers.add(register(LivingJumpEvent, (event) => this.onJump(event)).unregister());
        this.triggers.add(register(LivingUpdateEvent, (event) => this.onLivingUpdate(event)).unregister());
    }

    onJump(event) {
        const entity = event.entity;
        if (entity === null || entity !== Player.getPlayer()) return;
        if (!this.isToggled()) return;
        if (SpeedModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (this.movingDirection === null) return;
        const vec = this.movingDirection;
        let motionX = Player.getMotionX();
        let motionZ = Player.getMotionZ();

        motionX += vec[0] * 0.2;
        motionZ += vec[1] * 0.2;

        McUtils.setVelocity(motionX, Player.getMotionY(), motionZ);
        if (SpeedModule.enableOnce.getValue()) this.setToggled(false);
    }

    onLivingUpdate(event) {
        const entity = event.entity;
        if (entity === null || entity !== Player.getPlayer()) return;
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
        const thePlayer = entity;
        const isInWater = thePlayer.func_180799_ab();
        const isInLava = thePlayer.func_180799_ab();
        const onGround = thePlayer.field_70122_E;
        if (isInWater || isInLava) return;
        let walkSpeed = thePlayer.func_70689_ay();

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
    
        let length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
    
        if (length === 0) return
    
        const scalar = 1 / length;
    
        vec[0] *= scalar;
        vec[1] *= scalar;
    
        const yaw = Player.getYaw() * Math.PI / 180;
    
        const sin = Math.sin(yaw);
        const cos = Math.cos(yaw);
    
        [vec[0], vec[1]] = [vec[0] * cos - vec[1] * sin, vec[0] * sin + vec[1] * cos];

        let motionX = Player.getMotionX();
        let motionZ = Player.getMotionZ();

        let movementMultiplier = 1.3;
        if (Player.isSneaking()) movementMultiplier = 0.3;
        
        if (airTicks === 0 && !isInWater && !isInLava && !Player.isSneaking()) {
            motionX = vec[0] * walkSpeed * 2.857671997172534;
            motionZ = vec[1] * walkSpeed * 2.857671997172534;
        } else if ((!isInWater && !isInWater && airTicks === 1) || airTicks === 0) {
            let acceleration = walkSpeed * movementMultiplier;
            motionX += vec[0] * acceleration;
            motionZ += vec[1] * acceleration;
        } else {
            let acceleration = 0.02 * movementMultiplier;
            motionX += vec[0] * acceleration;
            motionZ += vec[1] * acceleration;
        }

        this.movingDirection = vec;

        KeyBindingUtils.setKeyState(Forward.func_151463_i(), false);
        KeyBindingUtils.setKeyState(Left.func_151463_i(), false);
        KeyBindingUtils.setKeyState(Back.func_151463_i(), false);
        KeyBindingUtils.setKeyState(Right.func_151463_i(), false);

        Scheduler.schedulePostPlayerTickTask(() => {
            this.movingDirection = null;
            KeyBindingUtils.setKeyState(Forward.func_151463_i(), f);
            KeyBindingUtils.setKeyState(Left.func_151463_i(), l);
            KeyBindingUtils.setKeyState(Back.func_151463_i(), b);
            KeyBindingUtils.setKeyState(Right.func_151463_i(), r);
        })

        McUtils.setVelocity(motionX, Player.getMotionY(), motionZ);
    
        if (SpeedModule.autoJump.getValue() && onGround) {
            jumpTicksField.setInt(thePlayer, 0);
            const keybindJump = KeyBindingUtils.gameSettings.field_74314_A;
            const wasJumpDown = keybindJump.func_151470_d();
            if (wasJumpDown) return;
            const JumpKey = keybindJump.func_151463_i();
            KeyBindingUtils.setKeyState(JumpKey, true);
            Scheduler.schedulePostTickTask(() => {
                KeyBindingUtils.setKeyState(JumpKey, false);
            })
        }
    }
}
