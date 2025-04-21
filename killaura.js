import { SilentRotationHandler } from "./module/modules/autoRoute/route/SilentRotationHandler"
import { ChatUtils } from "./utils/ChatUtils";
import { KeyBindingUtils } from "./utils/KeyBindingUtils";
import { McUtils } from "./utils/McUtils";
import { Scheduler } from "./utils/Scheduler";
import { SkyblockUtils } from "./utils/SkyblockUtils";

const targets = [
    "Fledgling ",
    "Bloodfiend "
];

const HELMET_UUID = "86f4193b-0604-3aa7-9f49-b3f02f2610a9"
const HELMET_TEXTURE = "rSEtNxPWR7mXC0BY6yHwCDEIFaJ/7cUOrogyUwlL6KBN5shkAV1kD5ECp21RGvv/4YvmCEs7QUOPmKpOBFsIKaFbZPDhptZlYh/C4a2XXf7psity/GDdczMKONrGtL+sQHO/+WqnQ+voLuOm5U3n8CC0aHHGWDerfZ8kxxnSfqNzeSvD7iWJGK7/k5tXmdhjFE+Dy2hJEqVaV5oxTXnyeFB85gXGPyzIVdnh0fNnhqEroqEo5T+sb5Ff4wU0/6zzr568KNqMxtCmbNs6xOpkHLAzuvYRUDs1O8emRjPKj5jQbZFcXjVyVUsC/DbrVx1g1lZ0soF27QRPmWrxtzVAwO3ZOsghgWhSM7gmseppbEgiXRBwW8YNiXcBxpdBD0ydZj+deA3djLpSFqh+TtkKBUxSBgCMl5q8om5uVzsm4BfomxHTu3ObuHHHiaSt8pzOFqJszR65WaICNmEFQ94I3RcHWjK7SS7lXs7XLbjrJ1ko9XVVgdQTLnDBmFQwr35P4EjWlx+0kH/PHHV+QzL1L2e0vjRqo16dGjxwpvu3nZSCgnUOXABi2/Se0KBBYEnxiJAl4F+tf7tiyoiiEikgNUzJqs9YVmMymDEhmORrW7SzkhbTTexmCEbZhBDkQNVQVpZAaqrGEyEalloT+dZk16tRf849kWFj4/zWzcqCqQ4="
const VALUE = "ewogICJ0aW1lc3RhbXAiIDogMTY4MDQ4Nzc0MTg2NSwKICAicHJvZmlsZUlkIiA6ICI4NDk1NTRmOWYzMGQ0NWQxYjUwNGY4ZDYzZmExZTM1OSIsCiAgInByb2ZpbGVOYW1lIiA6ICJSYWtoYVNoaSIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS9hZDBiOGNkODY1ZDViMDBmMGQ1ZDAwZmRjYzI4NDMxNjQxMjAyMWVmYzA5YzY3ODIyM2Y4M2I1YTNmOTRkNTBkIiwKICAgICAgIm1ldGFkYXRhIiA6IHsKICAgICAgICAibW9kZWwiIDogInNsaW0iCiAgICAgIH0KICAgIH0KICB9Cn0="

let toggled = false;
let swingRange = 5;
let angleStep = 60;
let switchDelay = 500;
let moveFix = false;
let lastSwitch = 0;
let lastTarget = null;
const EntityPlayer = Java.type("net.minecraft.entity.player.EntityPlayer");
const EntityGhast = Java.type("net.minecraft.entity.monster.EntityGhast");
const EntityZombie = Java.type("net.minecraft.entity.monster.EntityZombie");
const EntityCreeper = Java.type("net.minecraft.entity.monster.EntityCreeper");
const keyBindJump = KeyBindingUtils.gameSettings.field_74314_A;
const keyBindSneak = KeyBindingUtils.gameSettings.field_74311_E

const impelDelay = 1000;

let cachedLastLook = null;

let currentImpel = null;
let lastImpel = 0;

let nextForcePitch = null;

register("Tick", () => {
    if (!toggled) return;
    if (!SkyblockUtils.isInSkyblock()) return;
    if (Client.getMinecraft().field_71462_r) return;
    const now = Date.now();
    const lastlook = McUtils.getLastReportedRotations();
    cachedLastLook = lastlook;

    let forceImpelPitch = null;
    if (nextForcePitch) {
        forceImpelPitch = nextForcePitch;
        nextForcePitch = null;
    }

    let canImpel = now - lastImpel > impelDelay;

    if (currentImpel && canImpel) {
        switch (currentImpel) {
            case "UP":
                ChatLib.chat("UP")
                forceImpelPitch = -90;
                nextForcePitch = -90;
                Scheduler.schedulePostTickTask(() => {
                    KeyBindingUtils.setLeftClick(true)
                    KeyBindingUtils.setLeftClick(false)
                })
                break;

            case "DOWN":
                ChatLib.chat("DOWN")
                forceImpelPitch = 90;
                nextForcePitch = 90;
                Scheduler.schedulePostTickTask(() => {
                    KeyBindingUtils.setLeftClick(true)
                    KeyBindingUtils.setLeftClick(false)
                })
                break;

            case "JUMP":
                ChatLib.chat("JUMP")
                KeyBindingUtils.setKeyState(keyBindJump.func_151463_i(), true);
                Scheduler.schedulePostTickTask(() => {
                    KeyBindingUtils.setKeyState(keyBindJump.func_151463_i(), false);
                })
                break;

            case "SNEAK":
                ChatLib.chat("SNEAK")
                KeyBindingUtils.setKeyState(keyBindSneak.func_151463_i(), true);
                Scheduler.schedulePostTickTask(() => {
                    KeyBindingUtils.setKeyState(keyBindSneak.func_151463_i(), false);
                })
                break;

            default:
        }

        lastImpel = now;
        currentImpel = null;
    }
    let target = getTarget();
    let yaw, pitch;

    if (!target) {
        if (now - lastSwitch > 10000) targetInfoByEntity = new Map();
        if (!forceImpelPitch) return;
        yaw = lastlook[0];
        pitch = forceImpelPitch;
    } else {
        if (target.entity !== lastTarget?.entity) {
            lastSwitch = now;
            lastTarget = target;
            ChatLib.chat("switch")
        }
        if (!target.entity.func_70089_S()) return;
        targetInfoByEntity.set(target.entity.func_145782_y(), target);
        target.lastAttack = now;
        const mop = target.mop;
        const hitVec = mop.field_72307_f
        const angles = McUtils.getAngles(hitVec.field_72450_a, hitVec.field_72448_b, hitVec.field_72449_c, true, true, lastlook[0], lastlook[1]);
        angles[0] *= 1 - Math.random() * 0.1;
        angles[1] *= 1 - Math.random() * 0.1;
        angles[0] = MathLib.clamp(angles[0], -angleStep, angleStep);
        angles[1] = MathLib.clamp(angles[1], -angleStep, angleStep);
        angles[0] = applyGcd(angles[0]);
        angles[1] = applyGcd(angles[1]);
        yaw = lastlook[0] + angles[0];
        pitch = forceImpelPitch || lastlook[1] + angles[1];
    }
    if (isNaN(yaw) || isNaN(pitch)) return;
    if (Math.abs(pitch) > 90) {
        ChatLib.chat(`${yaw} ${pitch}`);
        return;
    }
    const result = SilentRotationHandler.doSilentRotation();
    McUtils.setRotations(yaw, pitch);

    if (!result) return;
    let s08Received = false;
    const thePlayer = Player.getPlayer();

    Scheduler.scheduleC03Task(() => s08Received = true);

    let silentRotations = {};

    Scheduler.schedulePrePlayerTickTask(() => {
        if (s08Received) return;
        silentRotations.yaw = thePlayer.field_70177_z;
        silentRotations.pitch = thePlayer.field_70125_A;
        silentRotations.prevYaw = thePlayer.field_70126_B;
        silentRotations.prevPitch = thePlayer.field_70127_C;
        
        if (!moveFix) {
            thePlayer.field_70177_z = SilentRotationHandler.realRotations.yaw;
            thePlayer.field_70125_A = SilentRotationHandler.realRotations.pitch;
            thePlayer.field_70126_B = SilentRotationHandler.realRotations.prevYaw;
            thePlayer.field_70127_C = SilentRotationHandler.realRotations.prevPitch;
        }
    })

    Scheduler.schedulePostPlayerTickTask(() => {
        if (s08Received) return;
        thePlayer.field_70177_z = silentRotations.yaw;
        thePlayer.field_70125_A = silentRotations.pitch;
        thePlayer.field_70126_B = silentRotations.prevYaw;
        thePlayer.field_70127_C = silentRotations.prevPitch;
    })

}).unregister().setPriority(Priority.LOW)

function applyGcd(value) {
    let sens = toFloat(Client.getMinecraft().field_71474_y.field_74341_c * toFloat(0.6) + toFloat(0.2));
    let gcd = toFloat(sens * sens * sens * toFloat(1.2));
    return toFloat(value - value % gcd);
}

function toFloat(value) {
    const Float = Java.type("java.lang.Float");
    return new Float(value).doubleValue();
}

register("Command", () => {
    toggled = !toggled;
    ChatUtils.prefixChat("killaura " + (toggled ? "on" : "off") + "!");
}).setName("meowka")

let targetInfoByEntity = new Map();
function getTarget() {
    const eyePos = Player.asPlayerMP().getEyePosition(1);
    const now = Date.now();
    if (now - lastSwitch < switchDelay) {
        const lastTargetInfo = getValidEntityInfo(lastTarget?.entity, eyePos);
        // ChatLib.chat(String(lastTargetInfo))
        return lastTargetInfo;
    }

    const targetsInRange = [];
    World.getAllEntitiesOfType(EntityPlayer).forEach(e => {
        if (!e.getEntity().func_70089_S()) return;
        const name = e.getName();
        if (!targets.includes(name)) return;
        // if (e.getEntity() === Player.getPlayer()) return;

        const entityInfo = getValidEntityInfo(e.getEntity(), eyePos);
        if (!entityInfo) return;
        entityInfo.lastAttack = targetInfoByEntity.get(e.getEntity().func_145782_y())?.lastAttack || 0;
        entityInfo.priority = name === "Bloodfiend " ? 1 : 0;

        targetsInRange.push(entityInfo);
    });

    World.getAllEntitiesOfType(EntityZombie).forEach(e => {
        if (!e.getEntity().func_70089_S()) return;
        const helmet = e.getEntity().func_71124_b(4);
        if (!helmet) return;
        const id = helmet.func_77978_p().func_74775_l("SkullOwner").func_74779_i("Id");
        if (id !== HELMET_UUID) return;

        const entityInfo = getValidEntityInfo(e.getEntity(), eyePos);
        if (!entityInfo) return;
        entityInfo.lastAttack = targetInfoByEntity.get(e.getEntity().func_145782_y())?.lastAttack || 0;
        entityInfo.priority = 0;

        targetsInRange.push(entityInfo);
    })

    targetsInRange.sort((a, b) => {
        const prio = b.priority - a.priority;
        if (prio !== 0 ) return prio;
        const la = a.lastAttack - b.lastAttack;
        if (la !== 0) return la;
        return a.distance - b.distance;
    });

    // if (targetsInRange.length) ChatLib.chat(targetsInRange.map(a => a.lastAttack).toString())

    const target = targetsInRange[0];
    if (!target) return null;
    // targetInfoByEntity.set(target.entity, target);
    // target.lastAttack = Date.now();
    return target;


}

const S45PacketTitle = Java.type("net.minecraft.network.play.server.S45PacketTitle");

register("PacketReceived", (packet) => {
    currentImpel = null;
    if (!toggled) return;
    if (Date.now() - lastImpel < impelDelay) return;
    let title = ChatLib.removeFormatting(packet.func_179805_b()?.func_150254_d());
    if (!title) return;
    if (title.match(/^Impel: CLICK UP \d\.\ds$/)) {
        currentImpel = "UP";
    } else if (title.match(/^Impel: JUMP \d\.\ds$/)) {
        currentImpel = "JUMP"
    } else if (title.match(/^Impel: CLICK DOWN \d\.\ds$/)) {
        currentImpel = "DOWN";
    } else if (title.match(/^Impel: SNEAK \d\.\ds$/)) {
        currentImpel = "SNEAK";
    }

    // Scheduler.schedulePostTickTask(() => currentImpel = null, 5)
}).setFilteredClass(S45PacketTitle)

function getValidEntityInfo(entity, eyePos) {
    if (!entity) return null;
    const mop = McUtils.getClosesetMOPOnEntity(eyePos, entity, cachedLastLook[0], cachedLastLook[1]);
    if (!mop) return null;
    const dist = McUtils.getDistance3D(eyePos, mop.field_72307_f);
    if (dist > swingRange) return null;

    return {
        entity: entity,
        mop: mop,
        distance: dist
    };
}

register("Command", () => {
    console.time("targets")
    const targets = getTarget();
    console.timeEnd("targets")
    ChatLib.chat(targets.map(a => `[${a.entity.getName()} ${a.lastAttack} ${a.distance}]`).join("\n"))
}).setName("getTargets");
