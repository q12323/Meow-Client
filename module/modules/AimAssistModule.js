import { Module } from "../Module";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { McUtils } from "../../utils/McUtils";

const Mouse = Java.type("org.lwjgl.input.Mouse");
const dx = Mouse.class.getDeclaredField("dx");
const dy = Mouse.class.getDeclaredField("dy");
dy.setAccessible(true);
dx.setAccessible(true);
const degToRad = Math.PI / 180;
const radToDeg = 180 / Math.PI;
const mc = McUtils.mc;

const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");

const EntityArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand");
const EntityOtherPlayerMP = Java.type("net.minecraft.client.entity.EntityOtherPlayerMP");

// TODO: use minecraft vec3 util
export class AimAssistModule extends Module {

    static horizontalSpeed = new PropertyNumber("horizontal-speed", 3, 0, 10);
    static verticalSpeed = new PropertyNumber("vertical-speed", 0, 0, 10);
    static range = new PropertyNumber("range", 6, 1, 8);
    static fov = new PropertyInteger("fov", 180, 0, 360);
    static eman = new PropertyBoolean("eman", false);
    static offsetY = new PropertyNumber("offset-y", 2, 0, 5);
    static strafe = new PropertyBoolean("strafe", true);
    static quadMode = new PropertyBoolean("quadratic-mode", false);
    static skyblockOnly = new PropertyBoolean("skyblock-only", true);

    constructor() {
        super("AimAssist", false, 0, false);

        this.targetId = null;
        this.target = null;
        this.targetDistance = null;
        
        this.strafeBoost = 0;
        this.width = 5;
        this.height = 15;

        this.stepCounter = 0;
        this.rtx = 0;
        this.rty = 0;
        
        this.prevPartialTicks = null;

        this.decDx = 0;
        this.decDy = 0;
        
        this.triggers.add(register("RenderWorld", (partialTicks) => this.onRenderWorld(partialTicks)).unregister());
        this.triggers.add(register(TickEvent.ClientTickEvent, (event) => this.onTick(event)).unregister());
        this.triggers.add(register("Step", () => this.onStep()).setFps(9).unregister());
    }

    setToggled(toggled) {
        if (toggled) {
            this.target = null;
            this.targetId = null;
            this.strafeBoost = 0;
            this.width = 5;
            this.height = 15;
            this.stepCounter = 0;
            this.rtx = 0;
            this.rty = 0;
            this.prevPartialTicks = null;
            this.decDx = 0;
            this.decDy = 0;
        }
        super.setToggled(toggled);
    }

    onStep() {
        if (!this.isToggled()) return;
        Mouse.poll();
        if (!Mouse.isButtonDown(0)) return;
        if (mc.field_71462_r !== null) return;

        if (this.stepCounter < 5) {
            this.stepCounter ++;
        } else if (this.stepCounter < 8) {
            this.stepCounter ++;
            this.rtx = 0;
            this.rty = 0;
        } else {
            this.stepCounter = 0;
            this.rtx = Math.random() * 0.8 - 0.4;
            this.rty = Math.random() * 0.8 - 0.4;
        }
    }

    onTick(event) {
        if (event.phase !== TickEvent.Phase.END) return;
        if (!this.isToggled()) return;
        if (!Player.getPlayer()) return;
        if (this.prevPartialTicks !== null) {
            this.prevPartialTicks -= 1;
        }
        Mouse.poll();
        if (!Mouse.isButtonDown(0) || mc.field_71462_r !== null) {
            this.target = null;
            this.targetId = null;
            return;
        }

        this.strafeBoost = 0;
        this.width = 5;
        if (AimAssistModule.strafe.getValue()) {
            const yaw = Player.getYaw() * degToRad;
            const motionX = Player.getMotionX();
            const motionZ = Player.getMotionZ();

            const strafeVelocity = motionX * Math.cos(yaw) + motionZ * Math.sin(yaw);
            // ChatLib.chat(strafeVelocity)

            this.strafeBoost = strafeVelocity * AimAssistModule.horizontalSpeed.getValue() * 2;
            // ChatLib.chat(AimAssistModule.strafeBoost)

            if (strafeVelocity !== 0) {
                this.width = AimAssistModule.horizontalSpeed.getValue() * 0.5 / ((strafeVelocity > 0 ? strafeVelocity : -strafeVelocity) * 20 + 1);
            }
        }
        
        if (this.targetId === null) {
            let fov = AimAssistModule.fov.getValue();

            for (let entity of World.getAllEntities()) {
                if (!this.isValidTarget(entity)) continue;

                let ytm = McUtils.getAngles(entity.getX(), entity.getY(), entity.getZ(), true, false)[0];

                ytm = ytm > 0 ? ytm : -ytm;
                if (ytm > fov) continue;
                fov = ytm;

                this.targetId = entity.getEntity().func_145782_y();
                this.target = entity;
                this.targetDistance = Player.getPlayer().func_70032_d(entity.getEntity());
            }
        } else {
            let entity = this.getEntityByEntityId(this.targetId);
            if (this.isValidTarget(entity)) {
                this.target = entity;
                this.targetDistance = Player.getPlayer().func_70032_d(entity.getEntity());
            } else {
                this.target = null;
                this.targetId = null;
                this.targetDistance = null;
            }
        }
    }

    onRenderWorld(partialTicks) {
        if (!this.isToggled()) return;
        if (this.prevPartialTicks === null) {
            this.prevPartialTicks = partialTicks;
            return;
        }
        let deltaPartialTicks = partialTicks - this.prevPartialTicks;
        this.prevPartialTicks = partialTicks;

        if (AimAssistModule.skyblockOnly.getValue() && !SkyblockUtils.isInSkyblock()) return;
        Mouse.poll();
        if (!Mouse.isButtonDown(0)) return;
        if (mc.field_71462_r !== null) return;

        if (this.target === null) return;

        let tx = this.target.getRenderX();
        let ty = this.target.getRenderY();
        let tz = this.target.getRenderZ();

        if (tx === null || ty === null || tz === null) return;

        const ey = Player.getRenderY() + Player.getPlayer().func_70047_e();

        ty = ey < ty - 0.1 ? ty - 0.1
        : ey < ty + 1.9 ? ey
        : ty + 1.9

        const width = this.width;
        const height = this.height;

        let [yawToMove, pitchToMove] = McUtils.getAngles(tx, ty, tz, true, true);

        yawToMove = isNaN(yawToMove) ? 0 : yawToMove;
        if ((yawToMove > 0 ? yawToMove : -yawToMove) > AimAssistModule.fov.getValue() * 0.5) {
            this.target = null;
            this.targetId = null;
            return;
        }
        yawToMove = yawToMove <= width && yawToMove >= -width ? 0 : yawToMove;
        yawToMove = this.getHorizontalVelocity(yawToMove, AimAssistModule.horizontalSpeed.getValue() * 3);

        pitchToMove = isNaN(pitchToMove) ? 0 : pitchToMove;
        pitchToMove = pitchToMove <= height && pitchToMove >= height - 30 ? 0 : pitchToMove;
        pitchToMove = this.getVerticalVelocity(pitchToMove, AimAssistModule.verticalSpeed.getValue() * 1);
        // return;
        this.addDxDy((yawToMove + this.strafeBoost + this.rtx) * (deltaPartialTicks) * 5, this.targetDistance > 1 ? -(pitchToMove + this.rty) * (deltaPartialTicks) * 5 : 0)
        
    }

    // TODO: make mouse utility class
    addDxDy(x, y) {
        let dec;

        [x, dec] = this.splitDecimal(x);
        this.decDx += dec;
        if (this.decDx >= 1) {
            this.decDx --;
            x ++;
        } else if (this.decDx <= -1) {
            this.decDx ++;
            x --;
        }
        dx.setInt(Mouse, dx.get(Mouse) + x);
        
        [y, dec] = this.splitDecimal(y);
        this.decDy += dec;
        if (this.decDy >= 1) {
            this.decDy --;
            y ++;
        } else if (this.decDy <= -1) {
            this.decDy ++;
            y --;
        }
        dy.setInt(Mouse, dy.get(Mouse) + y);
    }

    getHorizontalVelocity(x, speed) {
        const width = this.width;
        
        if (AimAssistModule.quadMode.getValue()) {
            // uses quadratic formula to cacluate aiming velocity when close to target (useless)
            return x > speed + width ? speed
            : x > 0 ? (x - width) * (x - width) / speed
            : x > -width ? 0
            : x > -speed - width ? -(x + width) * (x + width) / speed
            : -speed;
        } else {
            // just linear but faster aiming speed !!
            return x > speed + width ? 0.05 * (x - speed - width) + speed
            : x > 0 ? x - width
            : x > -width ? 0
            : x > -speed - width ? x + width
            : 0.05 * (x + speed + width) - speed;
        }

        // quadratic:
        // ^
        // | velocity
        // |
        // |       __________________
        // |      | (w + s, s)
        // |    _/
        // | __/  
        // ----------------------------->
        // |w                          x
        // |


        // linear:
        // ^
        // | velocity
        // |
        // |     __________________
        // |    * (w + s, s)
        // |   * 
        // |  * 
        // | *   
        // ----------------------------->
        // |w                          x
        // |
    }

    getVerticalVelocity(y, speed) {
        const height = this.height;
        
        return y > speed + height ? speed
            : y > height ? y - height
            : y > height - 30 ? 0
            : y > height - 30 - speed ? y - height + 30
            : -speed;
    }

    // TODO: mcutils maybe?
    getEntityByEntityId(id) {
        // return mc.field_75177_g.func_73045_a(id);
        for (let entity of World.getAllEntities()) {
            if (id == entity.getEntity().func_145782_y()) {
                return entity;
            }
        }
        return null;
             
    }

    isValidTarget(target) {
        if (target === null) return false;
        if (AimAssistModule.eman.getValue()) {
            if (!(target.getEntity() instanceof EntityArmorStand)) return false;
            if (!target.getEntity().func_174833_aM()) return false;
            if (ChatLib.removeFormatting(target.getName()) !== `Spawned by: ${Player.getName()}`) return;
        } else {
            if (!(target.getEntity() instanceof EntityOtherPlayerMP)) return false;
            if (target.isInvisible()) return false;
            // ChatLib.chat(target)
            // ChatLib.chat(target.getEntity());
            // ChatLib.chat(target.isInvisible());
            // console.log(target)
            // console.log(target.getEntity())
            // console.log([target.getRenderX(), target.getRenderY(), target.getRenderZ()].join(", "))
        }
        if (target.getEntity() === Player.getPlayer()) return false;
        if (mc.field_71439_g.func_70032_d(target.getEntity()) > AimAssistModule.range.getValue()) return false;
        return true;
    }
    
    /**
     * 
     * @param {number} x 
     * @returns [int, dec]
     */
    splitDecimal(x) {
        const dec = (x % 1);
        return [x - dec, dec];
    }

    getSuffix() {
        const horizontal = AimAssistModule.horizontalSpeed.getValue();
        const vertical = AimAssistModule.verticalSpeed.getValue();
        if (horizontal === vertical || vertical === 0) {
            return [String(horizontal)];
        }
        return [String(horizontal), String(vertical)];
    }
}
