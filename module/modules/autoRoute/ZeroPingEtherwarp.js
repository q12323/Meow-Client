// ZeroPingEtherwarp by UnclaimedBloom6 
// only for autoroute

import { getEtherwarpBlock, getLastSentLook, getSkyblockItemID } from "../../../../BloomCore/utils/Utils"
import { ChatUtils } from "../../../utils/ChatUtils"
import { Scheduler } from "../../../utils/Scheduler"
// import PogObject from "../PogData"

const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")
const C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook")
const C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction")

// const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

const EntityPlayerSP = Java.type("net.minecraft.client.entity.EntityPlayerSP");
const lastReportedPosXField = EntityPlayerSP.class.getDeclaredField("field_175172_bI");
const lastReportedPosYField = EntityPlayerSP.class.getDeclaredField("field_175166_bJ");
const lastReportedPosZField = EntityPlayerSP.class.getDeclaredField("field_175167_bK");

lastReportedPosXField.setAccessible(true);
lastReportedPosYField.setAccessible(true);
lastReportedPosZField.setAccessible(true);

export let zpewToggled = false;

const FAILWATCHPERIOD = 20 // 20 Seconds
const MAXFAILSPERFAILPERIOD = 3 // 3 fails allowed per 20 seconds. Higher numbers of fails could cause timer bans
const MAXQUEUEDPACKETS = 20 // Longest chain of queued zero ping teleports at a time
const recentFails = [] // Timestamps of the most recent failed teleports
const recentlySentC06s = [] // [{pitch, yaw, x, y, z, sentAt}, ...] in the order the packets were sent
let isSneaking = false

register("packetSent", (packet) => {
    const action = packet.func_180764_b()

    if (action == C0BPacketEntityAction.Action.START_SNEAKING) {
        isSneaking = true
    }
    else if (action == C0BPacketEntityAction.Action.STOP_SNEAKING) {
        isSneaking = false
    }
}).setFilteredClass(C0BPacketEntityAction)

register("worldUnload", () => {
    isSneaking = false
})

register("worldLoad", () => {
    isSneaking = false
})

const checkAllowedFails = () => {
    // Queue of teleports too long
    if (recentlySentC06s.length >= MAXQUEUEDPACKETS) return false
    
    // Filter old fails
    while (recentFails.length && Date.now() - recentFails[0] > FAILWATCHPERIOD * 1000) recentFails.shift()

    return recentFails.length < MAXFAILSPERFAILPERIOD
}

const validEtherwarpItems = new Set([
    "ASPECT_OF_THE_END",
    "ASPECT_OF_THE_VOID",
    "ETHERWARP_CONDUIT",
])

export const isHoldingEtherwarpItem = () => {
    const held = Player.getHeldItem()
    const sbId = getSkyblockItemID(held)

    if (!validEtherwarpItems.has(sbId)) return false
    
    // Etherwarp conduit doesn't have the ethermerge NBT tag, the ability is there by default
    return held.getNBT()?.toObject()?.tag?.ExtraAttributes?.ethermerge == 1 || sbId == "ETHERWARP_CONDUIT"
}

const getTunerBonusDistance = () => {
    return Player.getHeldItem()?.getNBT()?.toObject()?.tag?.ExtraAttributes?.tuned_transmission || 0
}

export const doZeroPingAotv = (x, y, z) => {

    if (isSneaking) return false;
    if (!isHoldingTeleportItem()) return false;
    if (!checkAllowedFails()) {
        ChatLib.chat(`&cZero ping etherwarp teleport aborted.\n&c${recentFails.length} fails last ${FAILWATCHPERIOD}s\n&c${recentlySentC06s.length} C06's queued currently`)
        return false;
    }

    let [pitch, yaw] = getLastSentLook();
    yaw %= 360

    x += 0.5
    z += 0.5

    const thisState = { pitch, yaw, x, y, z, sentAt: Date.now(), falid: false};

    recentlySentC06s.push(thisState)
    
    const onS08 = (packet, event) => {
        if (thisState.falid) return;
        if (!event.isCanceled()) {
            recentlySentC06s.shift();

            let newPitch = packet.func_148930_g()
            let newYaw = packet.func_148931_f()
            let newX = packet.func_148932_c()
            let newY = packet.func_148928_d()
            let newZ = packet.func_148933_e()
            const flag = packet.func_179834_f();
        
            if (flag.includes(S08PacketPlayerPosLook.EnumFlags.X_ROT)) {
                newPitch = thisState.pitch;
            }
        
            if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Y_ROT)) {
                newYaw = thisState.yaw;
            }
        
            const lastPresetPacketComparison = {
                pitch: isWithinTolerence(thisState.pitch, newPitch),
                yaw: isWithinTolerence(thisState.yaw, newYaw),
                x: thisState.x == newX,
                y: thisState.y == newY,
                z: thisState.z == newZ
            }
            const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a == true);

            if (wasPredictionCorrect) {
                cancel(event)
            } else {
                ChatUtils.prefixChat("&c&lzpew prediction incorrect!&r")
                recentFails.push(Date.now())
                while (recentlySentC06s.length) recentlySentC06s.shift().falid = true;
            }

            return;
        }

        Scheduler.scheduleLowS08Task(onS08, 1);
    }

    Scheduler.scheduleLowS08Task(onS08);

    // big big thanks to soshimeow for one tick thing
    Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, false));
    setPosistion(x, y, z)
    return true;

    
}

function isHoldingTeleportItem() {
    const held = Player.getHeldItem();
    if (!held) return false;
    let scrolls = held?.getNBT()?.toObject()?.tag?.ExtraAttributes?.ability_scroll;
    if (Array.isArray(scrolls) && scrolls.includes("IMPLOSION_SCROLL") && scrolls.includes("WITHER_SHIELD_SCROLL") && scrolls.includes("SHADOW_WARP_SCROLL")) {
        return true;
    }

    const id = getSkyblockItemID(held);

    if (id === "ASPECT_OF_THE_VOID" || id === "ASPECT_OF_THE_END") {
        return true;
    }

    return false;
}

let etherwarpFix = false;
export function setEtherwarpFix(value) {
    etherwarpFix = value;
}

export const doZeroPingEtherwarp = () => {

    const held = Player.getHeldItem()
    const item = getSkyblockItemID(held)
    // const blockID = Player.lookingAt()?.getType()?.getID()
    if (!isHoldingEtherwarpItem() || !isSneaking && item !== "ETHERWARP_CONDUIT"/* || blacklistedIds.includes(blockID)*/) return false;
    if (!checkAllowedFails()) {
        ChatLib.chat(`&cZero ping etherwarp teleport aborted.\n&c${recentFails.length} fails last ${FAILWATCHPERIOD}s\n&c${recentlySentC06s.length} C06's queued currently`)
        return false;
    }

    const rt = getEtherwarpBlock(57 + getTunerBonusDistance() - 1)
    
    if (!rt) {
      return false;
    }

    let [pitch, yaw] = getLastSentLook();
    yaw %= 360
    if (yaw < 0) yaw += 360

    let [x, y, z] = rt

    x += 0.5
    y += 1.05
    z += 0.5

    const thisState = { pitch, yaw, x, y, z, sentAt: Date.now(), falid: false};

    recentlySentC06s.push(thisState)
    
    const onS08 = (packet, event) => {
        if (thisState.falid) return;
        if (!event.isCanceled()) {
            recentlySentC06s.shift();

            let newPitch = packet.func_148930_g()
            let newYaw = packet.func_148931_f()
            let newX = packet.func_148932_c()
            let newY = packet.func_148928_d()
            let newZ = packet.func_148933_e()
            const flag = packet.func_179834_f();
        
            if (flag.includes(S08PacketPlayerPosLook.EnumFlags.X_ROT)) {
                newPitch = thisState.pitch;
            }
        
            if (flag.includes(S08PacketPlayerPosLook.EnumFlags.Y_ROT)) {
                newYaw = thisState.yaw;
            }
        
            const lastPresetPacketComparison = {
                pitch: isWithinTolerence(thisState.pitch, newPitch),
                yaw: isWithinTolerence(thisState.yaw, newYaw),
                x: thisState.x == newX,
                y: thisState.y == newY,
                z: thisState.z == newZ
            }
            const wasPredictionCorrect = Object.values(lastPresetPacketComparison).every(a => a == true);

            if (wasPredictionCorrect) {
                cancel(event)
            } else {
                ChatUtils.prefixChat("&c&lzpew prediction incorrect!&r")
                recentFails.push(Date.now())
                while (recentlySentC06s.length) recentlySentC06s.shift().falid = true;
            }

            return;
        }

        Scheduler.scheduleLowS08Task(onS08, 1);
    }

    Scheduler.scheduleLowS08Task(onS08);

    // big big thanks to soshimeow for one tick thing
    Client.sendPacket(new C06PacketPlayerPosLook(x, y, z, yaw, pitch, false));
    setPosistion(x, etherwarpFix ? y - 0.05 : y, z);

    return true;
}

export function setBlockSmoothTp(value) {
    blockSmoothTp = value;
}

let blockSmoothTp = true;

function setPosistion(x, y, z) {
    const thePlayer = Player.getPlayer();
    Player.getPlayer().func_70107_b(x, y, z);
    if (blockSmoothTp) {
        thePlayer.field_70169_q = x;
        thePlayer.field_70142_S = x;
        thePlayer.field_70167_r = y;
        thePlayer.field_70137_T = y;
        thePlayer.field_70166_s = z;
        thePlayer.field_70136_U = z;
    }
    Player.getPlayer().func_70016_h(0, 0, 0);
}

// For whatever rounding errors etc occur
const isWithinTolerence = (n1, n2) => Math.abs(n1 - n2) < 1e-4