import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyPercentage } from "../../property/properties/PropertyPercentage";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const mc = McUtils.mc;

// DO NOT USE THIS WITH OTHER KEEPSPRINT MOD
export class KeepSprintModule extends Module {

    static slowdown = new PropertyPercentage("slowdown", 0, 0, 40);
    // good for legit
    static forwardOnly = new PropertyBoolean("forward-only", false);
    static groundOnly = new PropertyBoolean("ground-only", false);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {
        super("KeepSprint", false, 0, false);

        this.triggers.add(register("AttackEntity", (entity, event) => this.onAttack(entity, event)).unregister());

    }

    onAttack(entity, event) {
        if (!this.isToggled()) return;
        if (KeepSprintModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (entity.getClassName() !== "EntityOtherPlayerMP") return;
        if (mc.field_71439_g === null) return;
        if (!Player.isSprinting()) return;
        if (KeepSprintModule.groundOnly.getValue() && !mc.field_71439_g.field_70122_E) return;
        if (KeepSprintModule.forwardOnly.getValue() && !this.isMovingForward()) return;

        mc.field_71439_g.field_70159_w *= (100 - KeepSprintModule.slowdown.getValue()) / 60;
        mc.field_71439_g.field_70179_y *= (100 - KeepSprintModule.slowdown.getValue()) / 60;
        mc.field_71439_g.func_70031_b(true);
    }

    isMovingForward() {
        const yaw = Player.getYaw() * Math.PI / 180;

        return -Math.sin(yaw) * Player.getMotionX() + Math.cos(yaw) * Player.getMotionZ() >= 0;
        
        // dumb way to calculate ngl
        
        // const rotationYaw = Player.getPlayer().field_70177_z * Math.PI / 180;
        // const yawVec = {
        //     x: - Math.sin(rotationYaw),
        //     z: Math.cos(rotationYaw)
        // };

        // const motion = {
        //     x: Player.getMotionX(),
        //     z: Player.getMotionZ()
        // };

        // const yawScalar = Math.sqrt(Math.pow(yawVec.x, 2) + Math.pow(yawVec.z, 2));
        // const motionScalar = Math.sqrt(Math.pow(motion.x, 2) + Math.pow(motion.z, 2));
        // const dotProduct = yawVec.x * motion.x + yawVec.z * motion.z;

        // const cos = dotProduct / (yawScalar * motionScalar);

        // return cos >= 0;

    }

    getSuffix() {
        return [KeepSprintModule.slowdown.getValue() + "%"];
    }
} 
