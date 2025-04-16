import { SilentRotationHandler } from "./module/modules/autoRoute/route/SilentRotationHandler"
import { ChatUtils } from "./utils/ChatUtils";
import { KeyBindingUtils } from "./utils/KeyBindingUtils";
import { McUtils } from "./utils/McUtils";
import { SkyblockUtils } from "./utils/SkyblockUtils";

let toggled = false;
let angleStep = 90;
const EntityPlayer = Java.type("net.minecraft.entity.player.EntityPlayer");
const EntityGhast = Java.type("net.minecraft.entity.monster.EntityGhast");

register("Tick", () => {
    if (!toggled) return;
    if (!SkyblockUtils.isInSkyblock()) return;
    if (Client.getMinecraft().field_71462_r) return;
    const entities = World.getAllEntitiesOfType(EntityGhast);
    let currentDist = 10;
    let target = null;
    for (let entity of entities) {
        if (entity.getEntity() === Player.getPlayer()) continue;
        let dist = Player.asPlayerMP().distanceTo(entity);
        if (dist > currentDist) continue;
        currentDist = dist;
        target = entity;
    }
    if (!target) return;
    const mop = McUtils.getClosesetMOPOnEntity(Player.asPlayerMP().getEyePosition(1), target.getEntity());
    if (!mop) return;
    const hitVec = mop.field_72307_f
    const lastlook = McUtils.getLastReportedRotations();
    const angles = McUtils.getAngles(hitVec.field_72450_a, hitVec.field_72448_b, hitVec.field_72449_c, true, true, lastlook[0], lastlook[1]);
    angles[0] = MathLib.clamp(angles[0], -angleStep, angleStep);
    const yaw = lastlook[0] + angles[0];
    const pitch = lastlook[1] + angles[1];
    if (Math.abs(pitch) > 90) {
        ChatLib.chat(`${yaw} ${pitch}`);
        return;
    }
    SilentRotationHandler.doSilentRotation();
    McUtils.setRotations(lastlook[0] + angles[0], lastlook[1] + angles[1]);
    // KeyBindingUtils.setLeftClick(true);
    // KeyBindingUtils.setLeftClick(false);
    if (!KeyBindingUtils.rightClick.func_151470_d()) KeyBindingUtils.setRightClick(true);
}).unregister().setPriority(Priority.HIGH)

register("Command", () => {
    toggled = !toggled;
    ChatUtils.prefixChat("killaura " + (toggled ? "on" : "off") + "!");
}).setName("meowka")