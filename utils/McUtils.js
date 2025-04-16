import { C08PacketPlayerBlockPlacement, traverseVoxels } from "../../BloomCore/utils/Utils";

const rightClickDelayTimer = Client.getMinecraft().getClass().getDeclaredField("field_71467_ac");
rightClickDelayTimer.setAccessible(true);

const MathHelper = Java.type("net.minecraft.util.MathHelper");
/**
 * x: field_72450_a
 * y: field_72448_b
 * z: field_72449_c
 */
const Vec3 = Java.type("net.minecraft.util.Vec3");

const PlayerControllerMP = Java.type("net.minecraft.client.multiplayer.PlayerControllerMP");
const syncCurrentPlayItemMethod = PlayerControllerMP.class.getDeclaredMethod("func_78750_j", null);
syncCurrentPlayItemMethod.setAccessible(true);

const MovingObjectPosition = Java.type("net.minecraft.util.MovingObjectPosition");
const BlockAir = Java.type("net.minecraft.block.BlockAir");

const radToDeg = 180 / Math.PI;
const degToRad = Math.PI / 180;
const mc = Client.getMinecraft();
// const C09PacketHeldItemChange = Java.type("net.minecraft.network.play.client.C09PacketHeldItemChange");
// const WorldSettings = Java.type("net.minecraft.world.WorldSettings");

const sneakHeight = 0.0800000429153443;
const Float = Java.type("java.lang.Float");

const EntityPlayerSP = Java.type("net.minecraft.client.entity.EntityPlayerSP");
const lastReportedYawField = EntityPlayerSP.class.getDeclaredField("field_175164_bL");
const lastReportedPitchField = EntityPlayerSP.class.getDeclaredField("field_175165_bM");
lastReportedYawField.setAccessible(true);
lastReportedPitchField.setAccessible(true);

const lastReportedPosXField = EntityPlayerSP.class.getDeclaredField("field_175172_bI");
const lastReportedPosYField = EntityPlayerSP.class.getDeclaredField("field_175166_bJ");
const lastReportedPosZField = EntityPlayerSP.class.getDeclaredField("field_175167_bK");

lastReportedPosXField.setAccessible(true);
lastReportedPosYField.setAccessible(true);
lastReportedPosZField.setAccessible(true);

export class McUtils {
    static mc = mc;

    static Vec3 = Vec3;

    static MovingObjectPosition = MovingObjectPosition;

    static setRightClickDelayTimer(tick) {
        rightClickDelayTimer.setInt(McUtils.mc, tick);
    }

    static getRightClickDelayTimer() {
        return rightClickDelayTimer.get(McUtils.mc);
    }

    static setVelocity(x, y, z) {
        Player.getPlayer().func_70016_h(x, y, z);
    }

    static getBlock(x, y, z) {
        return World.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z));
    }

    /**
     * just sets rotation yaw/pitch
     * @param {*} yaw 
     * @param {*} pitch 
     */
    static setRotations(yaw, pitch) {
        Player.getPlayer().field_70177_z = yaw;
        Player.getPlayer().field_70125_A = pitch;

    }

    static getRotations(yaw, pitch, currentYaw = Player.getYaw(), currentPitch = Player.getPitch()) {
        yaw = Number(yaw);
        pitch = Number(pitch);

        yaw = (yaw + 180) % 360 - 180;

        yaw -= currentYaw;
        pitch -= currentPitch;

        yaw += yaw < -180 ? 360
        : yaw > 180 ? -360
        : 0;

        return [yaw, pitch];
    }

    // better than just set rotation yaw/pitch
    static rotate(yaw, pitch) {
        // yaw = Number(yaw);
        // pitch = Number(pitch);
        // // while (yaw > 180) {
        // //     yaw -= 360;
        // // }
        // // while (yaw < -180) {
        // //     yaw += 360;
        // // }
        // yaw = (yaw + 180) % 360 - 180;
    
        // yaw -= Player.getYaw();
        // pitch -= Player.getPitch();
    
        // // if (yaw < -180) {
        // //     yaw += 360;
        // // } else if (yaw > 180) {
        // //     yaw -= 360;
        // // }
        // yaw += yaw < -180 ? 360
        // : yaw > 180 ? -360
        // : 0;

        const rotations = McUtils.getRotations(yaw, pitch);

        McUtils.setAngles(...rotations);
    
    }

    /**
     * sets angle from relative yaw/pitch
     * @param {number} yaw delta yaw
     * @param {number} pitch delta pitch
     */
    static setAngles(yaw, pitch) {
        yaw /= 0.15;
        pitch /= -0.15;

        yaw = isNaN(yaw) ? 0 : yaw;
        pitch = isNaN(pitch) ? 0 : pitch;

        Player.getPlayer().func_70082_c(yaw, pitch);
    }

    /**
     * 
     * @param {number} x target x
     * @param {number} y target y
     * @param {number} z target z
     * @param {boolean} calcYaw returns [null, pitchToMove] when false
     * @param {boolean} calcPitch returns [yawToMove, null] when false
     * @param {number} currentYaw 
     * @param {number} currentPitch
     * @returns [yawToMove, pitchToMove]
     */
    static getAngles(x, y, z, calcYaw, calcPitch, currentYaw = Player.getYaw(), currentPitch = Player.getPitch(), forceSneak = false) {
        let yawToMove = null;
        let pitchToMove = null;
        const ex = Player.getRenderX();
        const ez = Player.getRenderZ();
        const tvx = x - ex;
        const tvz = z - ez;

        if (calcYaw) {
            const yaw = currentYaw * degToRad;
            const evx = -Math.sin(yaw);
            const evz = Math.cos(yaw);
            // const evx = -McUtils.sin(yaw);
            // const evz = McUtils.cos(yaw);

            yawToMove = Math.atan2(evx * tvz - evz * tvx, evz * tvz + evx * tvx) * radToDeg;
        }
        if (calcPitch) {
            // const tvy = y - Player.getRenderY() - Player.getPlayer().func_70047_e();

            pitchToMove = -Math.atan2(y - Player.getRenderY() - Player.getPlayer().func_70047_e() - (!Player.isSneaking() && forceSneak ? sneakHeight : 0), Math.sqrt(tvx * tvx + tvz * tvz)) * radToDeg - currentPitch;
        }

        return [yawToMove, pitchToMove];
    }

    static sin(rad) {
        return MathHelper.func_76126_a(rad);
    }

    static cos(rad) {
        return MathHelper.func_76134_b(rad);
    }

    static rayTraceBlockBloom(maxDistance = 50, partialTicks = 1, forceSneak = false, yaw = Player.getYaw(), pitch = Player.getPitch()) {
        const eyeX = Player.getLastX() + (Player.getX() - Player.getLastX()) * partialTicks;
        const eyeHeight = Player.asPlayerMP().getEyeHeight() - (!Player.isSneaking() && forceSneak ? sneakHeight : 0);
        const eyeY = Player.getLastY() + (Player.getY() - Player.getLastY()) * partialTicks + eyeHeight;
        const eyeZ = Player.getLastZ() + (Player.getZ() - Player.getLastZ()) * partialTicks;

        yaw *= degToRad;
        pitch *= degToRad;
        const dx = -McUtils.cos(pitch) * McUtils.sin(yaw);
        const dy = -McUtils.sin(pitch);
        const dz = McUtils.cos(pitch) * McUtils.cos(yaw);
        const max = [dx * maxDistance + eyeX, dy * maxDistance + eyeY, dz * maxDistance + eyeZ];

        return traverseVoxels([eyeX, eyeY, eyeZ], max, null, false, true, true);
    }


    // i finally made it with stupid chatgpt
    /**
     * fuck chatgpt
     * fast voxel traversal
     * @param {*} maxDistance 
     * @param {*} partialTicks 
     * @param {*} forceSneak 
     * @param {*} yaw 
     * @param {*} pitch 
     * @returns [x, y, z] | null
     */
    static rayTraceBlock(maxDistance = 50, partialTicks = 1, forceSneak = false, yaw = Player.getYaw(), pitch = Player.getPitch(), playerX = null, playerY = null, playerZ = null) {
    
        const eyeX = playerX !== null ? playerX : Player.getLastX() + (Player.getX() - Player.getLastX()) * partialTicks;
        const eyeHeight = Player.asPlayerMP().getEyeHeight() - (!Player.isSneaking() && forceSneak ? sneakHeight : 0);
        const eyeY = (playerY !== null ? playerY : Player.getLastY() + (Player.getY() - Player.getLastY()) * partialTicks) + eyeHeight;
        const eyeZ = playerZ !== null ? playerZ : Player.getLastZ() + (Player.getZ() - Player.getLastZ()) * partialTicks;
    
        // yaw *= degToRad;
        // pitch *= degToRad;

        yaw = new Float(Number(yaw).toFixed(14));
        pitch = new Float(Number(pitch).toFixed(14));

        if (isNaN(yaw) || isNaN(pitch)) return null;

        // yaw = new Float(yaw.toFixed(14) * degToRad);
        // pitch = new Float(pitch.toFixed(14) * degToRad);

        // yaw = Player.getYaw();
        // pitch = Player.getPitch();

        yaw *= degToRad;
        pitch *= degToRad;

        // const cosPitch = McUtils.cos(pitch);

        // const dx = -cosPitch * McUtils.sin(yaw);
        // const dy = -McUtils.sin(pitch);
        // const dz = cosPitch * McUtils.cos(yaw);

        const cosPitch = Math.cos(pitch);

        const dx = -cosPitch * Math.sin(yaw);
        const dy = -Math.sin(pitch);
        const dz = cosPitch * Math.cos(yaw);
    
        let x = Math.floor(eyeX);
        let y = Math.floor(eyeY);
        let z = Math.floor(eyeZ);
    
        const stepX = dx < 0 ? -1 : 1;
        const stepY = dy < 0 ? -1 : 1;
        const stepZ = dz < 0 ? -1 : 1;
    
        const tDeltaX = Math.abs(1 / dx);
        const tDeltaY = Math.abs(1 / dy);
        const tDeltaZ = Math.abs(1 / dz);
    
        let tMaxX = (dx < 0 ? eyeX - x : x + 1 - eyeX) * tDeltaX;
        let tMaxY = (dy < 0 ? eyeY - y : y + 1 - eyeY) * tDeltaY;
        let tMaxZ = (dz < 0 ? eyeZ - z : z + 1 - eyeZ) * tDeltaZ;
        
        if (McUtils.getBlock(x, y, z)?.type?.getID() !== 0) {
            return [eyeX, eyeY, eyeZ];
        }
    
        for (let i = 0; i < maxDistance; i++) {
    
            let c = Math.min(tMaxX, tMaxY, tMaxZ);
    
            let hit = [
                eyeX + dx * c,
                eyeY + dy * c,
                eyeZ + dz * c
            ].map(coord => Math.round(coord * 1e10) * 1e-10);
    
            if (tMaxX < tMaxY && tMaxX < tMaxZ) {
                x += stepX;
                tMaxX += tDeltaX;
            } else if (tMaxY < tMaxZ) {
                y += stepY;
                tMaxY += tDeltaY;
            } else {
                z += stepZ;
                tMaxZ += tDeltaZ;
            }

            if (McUtils.getBlock(x, y, z)?.type?.getID() !== 0) {
                return hit;
            }
        }
    
        return null;
    }

    static syncCurrentPlayItem() {
        syncCurrentPlayItemMethod.invoke(mc.field_71442_b, null);
    }

    static sendUseItem() {
        const itemStack = Player.getPlayer().field_71071_by.func_70448_g();
        if (itemStack === null) {
            this.syncCurrentPlayItem();
            Client.sendPacket(new C08PacketPlayerBlockPlacement(itemStack));
        } else {
            mc.field_71442_b.func_78769_a(Player.getPlayer(), World.getWorld(), itemStack)
        }
    }

    static wrapAngleTo180_float(value) {
        MathHelper.func_76138_g(value);
    }

    /**
     * uses mc world, blockpos, blackstate
     */
    static setBlock(world, blockPos, blockState) {
        world.func_175656_a(blockPos, blockState);
        world.func_175689_h(blockPos);
    }

    /**
     * 
     * @param {Array} pos [x, y, z]
     * @param {Array} min [minX, minY, minZ]
     * @param {Array} max [maxX, maxY, maxZ]
     * @returns [x, y, z]
     */
    static getClosesetCoords3D(pos, min, max) {
        pos = this.getVec3FromArray(pos);
        min = this.getVec3FromArray(min);
        max = this.getVec3FromArray(max);

        return new Vec3(
            Math.max(min.field_72450_a, Math.min(pos.field_72450_a, max.field_72450_a)),
            Math.max(min.field_72448_b, Math.min(pos.field_72448_b, max.field_72448_b)),
            Math.max(min.field_72449_c, Math.min(pos.field_72449_c, max.field_72449_c))
        );
    }
    // .field_72450_a
    // .field_72448_b
    // .field_72449_c

    static getDistance3D(pos1, pos2) {
        pos1 = this.getVec3FromArray(pos1);
        pos2 = this.getVec3FromArray(pos2);
        return pos1.func_72438_d(pos2);
        // return Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2 + (pos1[2] - pos2[2]) ** 2);
    }

    static getVec3FromArray(array) {
        if (array instanceof Vec3) return array;
        return new Vec3(array[0], array[1], array[2]);
    }

    static getClosesetMOPOnBlock(eyePos, blockPos, world) {
        const block = world.func_180495_p(blockPos).func_177230_c();
        if (block instanceof BlockAir) return null;
        const aabb = block.func_180646_a(world, blockPos);
        
        // let closest = McUtils.getClosesetCoords3D(
        //     eyePos,
        //     new Vec3(
        //         aabb.field_72340_a,
        //         aabb.field_72338_b,
        //         aabb.field_72339_c
        //     ),
        //     new Vec3(
        //         aabb.field_72336_d,
        //         aabb.field_72337_e,
        //         aabb.field_72334_f
        //     )
        // );

        let closest = new Vec3(
            (aabb.field_72336_d + aabb.field_72340_a) * 0.5,
            (aabb.field_72337_e + aabb.field_72338_b) * 0.5,
            (aabb.field_72334_f + aabb.field_72339_c) * 0.5
        );
        
        // when inside of target block
        if (eyePos.field_72450_a === closest.field_72450_a && eyePos.field_72448_b === closest.field_72448_b && eyePos.field_72449_c === closest.field_72449_c) {
            const yaw = Player.getYaw() * degToRad;
            const pitch = Player.getPitch() * degToRad;

            const cosPitch = this.cos(pitch);
            const dx = -cosPitch * this.sin(yaw);
            const dy = -this.sin(pitch);
            const dz = cosPitch * this.cos(yaw);

            const diagonal = Math.sqrt(
                (aabb.field_72336_d - aabb.field_72340_a) ** 2 +
                (aabb.field_72337_e - aabb.field_72338_b) ** 2 +
                (aabb.field_72334_f - aabb.field_72339_c) ** 2
            ) + 1;

            closest = closest.func_72441_c(dx * diagonal, dy * diagonal, dz * diagonal);
        }

        const mop = aabb.func_72327_a(eyePos, closest);
        if (!mop) return null;

        return new MovingObjectPosition(mop.field_72307_f, mop.field_178784_b, blockPos);
    }

    static getClosesetMOPOnEntity(eyePos, entity) {
        const collisionBorderSize = entity.func_70111_Y();
        const aabb = entity.func_174813_aQ();
        
        let closest = McUtils.getClosesetCoords3D(
            eyePos,
            new Vec3(
                aabb.field_72340_a,
                aabb.field_72338_b,
                aabb.field_72339_c
            ),
            new Vec3(
                aabb.field_72336_d,
                aabb.field_72337_e,
                aabb.field_72334_f
            )
        );
        
        // when inside of target entity
        if (eyePos.field_72450_a === closest.field_72450_a && eyePos.field_72448_b === closest.field_72448_b && eyePos.field_72449_c === closest.field_72449_c) {
            const yaw = Player.getYaw() * degToRad;
            const pitch = Player.getPitch() * degToRad;
    
            const cosPitch = this.cos(pitch);
            const dx = -cosPitch * this.sin(yaw);
            const dy = -this.sin(pitch);
            const dz = cosPitch * this.cos(yaw);
    
            const diagonal = Math.sqrt(
                (aabb.field_72336_d - aabb.field_72340_a + collisionBorderSize * 2) ** 2 +
                (aabb.field_72337_e - aabb.field_72338_b + collisionBorderSize * 2) ** 2 +
                (aabb.field_72334_f - aabb.field_72339_c + collisionBorderSize * 2) ** 2
            ) + 1;
    
            closest = closest.func_72441_c(dx * diagonal, dy * diagonal, dz * diagonal);
        }
    
        const mop = aabb.func_72314_b(collisionBorderSize, collisionBorderSize, collisionBorderSize).func_72327_a(eyePos, closest);
        if (!mop) return null;
    
        return new MovingObjectPosition(entity, mop.field_72307_f);
    }

    static useEntity(movingObject) {
        const thePlayer = Player.getPlayer();
        const theWorld = World.getWorld();
        const entityHit = movingObject.field_72308_g;
        const hitVec = movingObject.field_72307_f;
        if (!entityHit || !hitVec) return;
        let flag = true;
    
        if (mc.field_71442_b.func_178894_a(thePlayer, entityHit, movingObject)) {
            flag = false;
        } else if (mc.field_71442_b.func_78768_b(thePlayer, entityHit)) {
            flag = false;
        }
    
        if (flag) {
            const itemstack = thePlayer.field_71071_by.func_70448_g();
    
            if (itemstack !== null && mc.field_71442_b.func_78769_a(thePlayer, theWorld, itemstack)) {
                mc.field_71460_t.field_78516_c.func_78445_c();
            }
        }
    }

    /**
     * @returns [x, y, z]
     */
    static getLastReportedPos() {
        const thePlayer = Player.getPlayer();
        return [
            lastReportedPosXField.get(thePlayer),
            lastReportedPosYField.get(thePlayer),
            lastReportedPosZField.get(thePlayer)
        ];
    }

    /**
     * @returns [yaw, pitch]
     */
    static getLastReportedRotations() {
        const thePlayer = Player.getPlayer();
        return [
            lastReportedYawField.get(thePlayer),
            lastReportedPitchField.get(thePlayer)
        ];
    }

    static setSneaking(sneaking) {
        Player.getPlayer().field_71158_b.field_78899_d = sneaking;
    }

}