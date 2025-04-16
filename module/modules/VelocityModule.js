import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyPercentage } from "../../property/properties/PropertyPercentage";
import { ChatUtils } from "../../utils/ChatUtils";
import { ItemUtils } from "../../utils/ItemUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const mc = McUtils.mc;

const S12PacketEntityVelocity = Java.type("net.minecraft.network.play.server.S12PacketEntityVelocity");
const velocityMotionXField = S12PacketEntityVelocity.class.getDeclaredField("field_149415_b");
const velocityMotionYField = S12PacketEntityVelocity.class.getDeclaredField("field_149416_c");
const velocityMotionZField = S12PacketEntityVelocity.class.getDeclaredField("field_149414_d");
velocityMotionXField.setAccessible(true);
velocityMotionYField.setAccessible(true);
velocityMotionZField.setAccessible(true);

const S27PacketExplosion = Java.type("net.minecraft.network.play.server.S27PacketExplosion");
const explosionMotionXField = S27PacketExplosion.class.getDeclaredField("field_149152_f");
const explosionMotionYField = S27PacketExplosion.class.getDeclaredField("field_149153_g");
const explosionMotionZField = S27PacketExplosion.class.getDeclaredField("field_149159_h");
explosionMotionXField.setAccessible(true);
explosionMotionYField.setAccessible(true);
explosionMotionZField.setAccessible(true);

export class VelocityModule extends Module {

    static horizontal = new PropertyPercentage("horizontal", 0, 0, 100);
    static vertical = new PropertyPercentage("vertical", 100, 0, 100);
    static explosionsHorizontal = new PropertyPercentage("explosions-horizontal", 100, 0, 100);
    static explosionsVertical = new PropertyPercentage("explosions-vertical", 100, 0, 100);
    static chance = new PropertyPercentage("chance", 100, 0, 100);
    static ticks = new PropertyInteger("ticks", 0, 0, 10);
    static keepMotion = new PropertyPercentage("keep-motion", 100, 0, 100);
    static jerrygunOnly = new PropertyBoolean("jerrygun-only", false);
    static bonzoCheck = new PropertyBoolean("bonzo-check", true);
    // static explosion = new PropertyBoolean("explosion", true);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {

        super("Velocity", false, 0, false);

        this.tickCounter = 0;
        this.isTickMode = false;
        this.bonzoCounter = 0;

        VelocityModule.vertical.onProperty((value) => {
            if (value !== 100) {
                ChatUtils.chat(ChatUtils.PREFIX + "&c&lWARNING&r: &oVERTICAL&r velocity can NOT usually bypass!&r")
            }
        });

        this.triggers.add(register("PacketReceived", (packet, event) => this.onVelocityPacketReceived(packet, event)).setFilteredClass(S12PacketEntityVelocity).unregister())
        this.triggers.add(register("tick", () => this.onTick()).unregister());
        this.triggers.add(register("Tick", () => this.onTickBonzo()).unregister());
        this.triggers.add(register("PacketReceived", (packet, event) => this.onExplosionPacketReceived(packet, event)).setFilteredClass(S27PacketExplosion).unregister());

    }

    onExplosionPacketReceived(packet, event) {
        if (!this.isToggled()) return;
        if (VelocityModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (VelocityModule.chance !== 100 && Math.random() * 100 >= VelocityModule.chance.getValue()) return;
        if (VelocityModule.jerrygunOnly.getValue()) return;

        const packetMotionX = packet.func_149149_c();
        const packetMotionY = packet.func_149144_d();
        const packetMotionZ = packet.func_149147_e();

        const newMotionX = packetMotionX * VelocityModule.explosionsHorizontal.getValue() / 100;
        const newMotionY = packetMotionY * VelocityModule.explosionsVertical.getValue() / 100;
        const newMotionZ = packetMotionZ * VelocityModule.explosionsHorizontal.getValue() / 100;

        if (VelocityModule.explosionsHorizontal.getValue() != 100) {
            explosionMotionXField.setFloat(packet, newMotionX);
            explosionMotionZField.setFloat(packet, newMotionZ);
        }
        if (VelocityModule.explosionsVertical.getValue() != 100) {
            explosionMotionYField.setFloat(packet, newMotionY);
        }
    }

    onVelocityPacketReceived(packet, event) {
        if (!this.isToggled()) return;
        if (VelocityModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (mc.field_71439_g === null) return;
        if (packet.func_149412_c() !== mc.field_71439_g.func_145782_y()) return;
        if (VelocityModule.chance !== 100 && Math.random() * 100 >= VelocityModule.chance.getValue()) return;
        if (VelocityModule.jerrygunOnly.getValue() && !(ItemUtils.getSkyblockItemID(ItemUtils.getHeldItem()) === "JERRY_STAFF" && packet.func_149410_e() == 4800)) return;
        if (VelocityModule.bonzoCheck.getValue() && this.bonzoCounter < 20 && packet.func_149410_e() == 4000) return;

        if (VelocityModule.ticks.getValue() !== 0) {
            this.tickCounter = VelocityModule.ticks.getValue();
            this.isTickMode = true;
            return ;
        } else {
            this.tickCounter = 0;
            this.isTickMode = false;
        }
        let keepMotionHorizontal = 0, keepmMotionVertical = 0;

        if (VelocityModule.horizontal.getValue() === 0) {
            keepMotionHorizontal = VelocityModule.keepMotion.getValue();
        } else {
            keepMotionHorizontal = 0;
        }

        if (VelocityModule.vertical.getValue() === 0) {
            keepmMotionVertical = VelocityModule.keepMotion.getValue();
        } else {
            keepmMotionVertical = 0;
        }

        const packetMotionX = packet.func_149411_d();
        const packetMotionY = packet.func_149410_e();
        const packetMotionZ = packet.func_149409_f();

        const newMotionX = packetMotionX * VelocityModule.horizontal.getValue() / 100 + Player.getMotionX() * keepMotionHorizontal * 80; // keepMotionH / 100 * 8000;
        const newMotionY = packetMotionY * VelocityModule.vertical.getValue() / 100 + Player.getMotionY() * keepmMotionVertical * 80;
        const newMotionZ = packetMotionZ * VelocityModule.horizontal.getValue() / 100 + Player.getMotionZ() * keepMotionHorizontal * 80;

        if (VelocityModule.horizontal.getValue() != 100) {
            velocityMotionXField.setInt(packet, newMotionX);
            velocityMotionZField.setInt(packet, newMotionZ);
        }
        if (VelocityModule.vertical.getValue() != 100) {
            velocityMotionYField.setInt(packet, newMotionY);
        }

        return;

    }

    // TODO: use Client.scheduleTask or make it trigger
    onTick() {
        if (!this.isToggled()) return;
        if (VelocityModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (!this.isTickMode) return;
        if (VelocityModule.ticks.getValue() === 0) return;
        if (mc.field_71439_g === null) return;
        if (this.tickCounter <= 0) {
            if (VelocityModule.horizontal.getValue() !== 100) {
                mc.field_71439_g.field_70159_w *= VelocityModule.horizontal.getValue()/100;
                mc.field_71439_g.field_70179_y *= VelocityModule.horizontal.getValue()/100;
            }

            if (VelocityModule.vertical.getValue() !== 100) {
                mc.field_71439_g.field_70181_x *= VelocityModule.vertical.getValue()/100;
            }
            
            this.isTickMode = false;

        } else {
            this.tickCounter -= 1;
        }

        return;
        
    }

    onTickBonzo() {
        if (!this.isToggled()) return;
        if (VelocityModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        if (!VelocityModule.bonzoCheck.getValue()) return;
        if (ItemUtils.getSkyblockItemID(ItemUtils.getHeldItem()) === "BONZO_STAFF") {
            this.bonzoCounter = 0;
        } else this.bonzoCounter += 1;

    }

    getSuffix() {
        return [`${VelocityModule.horizontal.getValue()}%`, `${VelocityModule.vertical.getValue()}%`]
    }
}
