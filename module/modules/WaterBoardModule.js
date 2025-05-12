import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { RoomUtils } from "../../utils/RoomUtils";
import { Scheduler } from "../../utils/Scheduler";
import { Module } from "../Module";
import { SilentRotationHandler } from "./autoRoute/route/SilentRotationHandler";
import { doZeroPingEtherwarp } from "./autoRoute/ZeroPingEtherwarp";


const WaterSolver = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.WaterSolver");
const DungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils");
const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");

const iField = WaterSolver.LeverBlock.class.getDeclaredField("i");
iField.setAccessible(true);

const solutionsField = WaterSolver.class.getDeclaredField("solutions");
solutionsField.setAccessible(true);

const patternIdentifierField = WaterSolver.class.getDeclaredField("patternIdentifier");
patternIdentifierField.setAccessible(true);

const getLeverPosMethod = WaterSolver.LeverBlock.class.getDeclaredMethod("getLeverPos");
getLeverPosMethod.setAccessible(true);

const tickCounterField = WaterSolver.class.getDeclaredField("tickCounter");
tickCounterField.setAccessible(true);

const openedWaterTicksField = WaterSolver.class.getDeclaredField("openedWaterTicks");
openedWaterTicksField.setAccessible(true);

const sneakHeight = 1.5399999618530273;

const EtherPos = {
    START: new BlockPos(15, 68, 6).toMCBlock(),
    START1: new BlockPos(15, 58, 14).toMCBlock(),
    CHEST: new BlockPos(15, 58, 20).toMCBlock(),
    COAL: new BlockPos(18, 58, 10).toMCBlock(),
    GOLD: new BlockPos(18, 58, 15).toMCBlock(),
    QUARTZ: new BlockPos(18, 58, 20).toMCBlock(),
    DIAMOND: new BlockPos(12, 58, 20).toMCBlock(),
    EMERALD: new BlockPos(12, 58, 15).toMCBlock(),
    CLAY: new BlockPos(12, 58, 10).toMCBlock(),
    WATER: new BlockPos(15, 58, 9).toMCBlock()
}

const LeverBlock = {
    CHEST: {
        toString: () => "CHEST",
        getChestPos: () => {
            return RoomUtils.getRealBlockPos(new BlockPos(15, 56, 22).toMCBlock())
        }
    }
};

const WOOL_POSES = [];

for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 5; k++) {
            WOOL_POSES.push(new BlockPos(14 + i, 56 + j, 15 + k));
        }
    }
}

const CHEST_CLICK_DELAY = 1000;

let lastWarpBlock = null;
let lastChestClick = 0;

export class WaterBoardModule extends Module {
    constructor() {
        super("WaterBoard", false, 0, false);
        
        const VALUESField = WaterSolver.LeverBlock.class.getDeclaredField("$VALUES");
        VALUESField.setAccessible(true);
        const VALUES = VALUESField.get(null);
        for (let value of VALUES) {
            LeverBlock[value.toString()] = value;
        }

        this.triggers.add(register(TickEvent.PlayerTickEvent, (event) => this.onUpdatePost(event)).unregister());
    }

    onUpdatePost(event) {
        if (event.phase !== TickEvent.Phase.END) return;
        const entity = event.player;
        if (entity === null) return;
        if (entity !== Player.getPlayer()) return;
        if (event.isCanceled()) return;
        if (!this.isToggled()) return;

        if (this.isMoving()) {
            lastWarpBlock = null;
            return;
        }
        const current = this.getCurrentStandingEtherPos();
        if (!current) {
            lastWarpBlock = null;
            return;
        }
        McUtils.setVelocity(0, Player.getMotionY(), 0);
        this.unPress();
    
        const levers = this.getSortedLeverList();
    
        if (current === EtherPos.START) {
            this.rotateTo(EtherPos.START1);
            if (levers && String(lastWarpBlock) !== String(EtherPos.START1)) {
                lastWarpBlock = EtherPos.START1;
                this.etherwarp();
            }
            return;
        }
    
        if (!levers) {
            lastWarpBlock = null;
            return;
        }
    
        const firstLever = levers[0];
        const secondLever = levers[1];
    
        if (EtherPos[String(firstLever)] === current) {
            if (String(firstLever) === String(LeverBlock.CHEST)) {
                if (Date.now() - lastChestClick > CHEST_CLICK_DELAY && this.canClickChest()) {
                    this.clickBlock(LeverBlock.CHEST.getChestPos());
                    lastChestClick = Date.now();
                }
                return;
            }
    
            this.rotateTo(EtherPos[String(secondLever)]);
            const canClick = this.canClickLever(firstLever);
            if (!canClick) return;
    
            Scheduler.schedulePostTickTask(() => {
                const pos = this.getLeverPos(firstLever);
                this.clickBlock(pos);
            });
    
            return;
        }
    
        this.rotateTo(EtherPos[String(firstLever)]);
    
        if (String(lastWarpBlock) !== String(firstLever)) {
            lastWarpBlock = firstLever;
            this.etherwarp();
        }
    }
    
    
    canClickChest() {
        return WOOL_POSES.every((p) => World.getBlockAt(new BlockPos(RoomUtils.getRealBlockPos(p.toMCBlock()))).type.getID() === 0 )
    }
    
    clickBlock(pos) {
        const eyePos = Player.asPlayerMP().getEyePosition(1);
        const mop = McUtils.getClosesetMOPOnBlock(eyePos, pos, World.getWorld());
        if (!mop) return;
        if (McUtils.getDistance3D(eyePos, mop.field_72307_f) > 4.5) return;
    
        const blockPos = mop.func_178782_a();
        const hitVec = mop.field_72307_f;
    
        const offsetX = hitVec.field_72450_a - blockPos.func_177958_n();
        const offsetY = hitVec.field_72448_b - blockPos.func_177956_o();
        const offsetZ = hitVec.field_72449_c - blockPos.func_177952_p();
    
        if (!this.isValidBlockOffset(offsetX) || !this.isValidBlockOffset(offsetY) || !this.isValidBlockOffset(offsetZ)) return;
    
        McUtils.syncCurrentPlayItem();
        
        const heldItem = Player.getPlayer().field_71071_by.func_70448_g();
    
        Client.sendPacket(
            new C08PacketPlayerBlockPlacement(
                blockPos,
                mop.field_178784_b.func_176745_a(),
                heldItem,
                offsetX,
                offsetY,
                offsetZ
            )
        );
        Client.sendPacket(new C08PacketPlayerBlockPlacement(heldItem));
    }
    
    isValidBlockOffset(offset) {
        return offset >= 0 && offset <= 1;
    }
    
    rotateTo(pos) {
        pos = RoomUtils.getRealBlockPos(pos);
        pos = [pos.func_177958_n() + 0.5, pos.func_177956_o() + 1, pos.func_177952_p() + 0.5];
    
        const angles = this.getAngles(pos[0], pos[1], pos[2]);
    
        SilentRotationHandler.doSilentRotation();
        McUtils.setAngles(angles[0], angles[1]);
    }
    
    etherwarp() {
        McUtils.setVelocity(0, Player.getMotionY(), 0);
        this.unPress();
        McUtils.setSneaking(true);
    
        Scheduler.schedulePostTickTask(() => {
            McUtils.sendUseItem();
            doZeroPingEtherwarp();
        })
    }

    isMoving() {
        const Forward = KeyBindingUtils.gameSettings.field_74351_w.func_151463_i();
        const Left = KeyBindingUtils.gameSettings.field_74370_x.func_151463_i();
        const Back = KeyBindingUtils.gameSettings.field_74368_y.func_151463_i();
        const Right = KeyBindingUtils.gameSettings.field_74366_z.func_151463_i();
        return Player.getMotionX() !== 0 || Player.getMotionZ() !== 0 || KeyBindingUtils.isKeyDown(Forward) || KeyBindingUtils.isKeyDown(Left) || KeyBindingUtils.isKeyDown(Back) || KeyBindingUtils.isKeyDown(Right);
    }
    
    unPress() {
        const Forward = KeyBindingUtils.gameSettings.field_74351_w.func_151463_i();
        const Left = KeyBindingUtils.gameSettings.field_74370_x.func_151463_i();
        const Back = KeyBindingUtils.gameSettings.field_74368_y.func_151463_i();
        const Right = KeyBindingUtils.gameSettings.field_74366_z.func_151463_i();
        KeyBindingUtils.setKeyState(Forward, false);
        KeyBindingUtils.setKeyState(Left, false);
        KeyBindingUtils.setKeyState(Back, false);
        KeyBindingUtils.setKeyState(Right, false);
    }
    
    getCurrentStandingEtherPos() {
        const x = Math.floor(Player.getX());
        const y = Math.floor(Player.getY() - 1);
        const z = Math.floor(Player.getZ());
        const pos = RoomUtils.getRelativeBlockPos(new BlockPos(x, y, z).toMCBlock());
    
        const keys = Object.keys(EtherPos);
        for (let key of keys) {
            let etherPos = EtherPos[key];
            if (pos.equals(etherPos)) return etherPos;
        }
    
        return null;
    }

    getSortedLeverList() {
        const solutions = this.getSolutions();
        if (this.getPatternIdentifier() === -1 || solutions.isEmpty() || DungeonUtils.INSTANCE.currentRoomName != "Water Board") return null;
    
        let solutionList = [];
    
        solutions.forEach((lever, times) => {
            const i = this.getI(lever);
            if (times.length <= i) return;
            solutionList.push([lever, times[i], solutionList.length]);
        })
    
        solutionList.sort((a, b) => {
            if (a[1] !== b[1]) return a[1] - b[1];
            if (a[0] === LeverBlock.WATER) return 1;
            if (b[0] === LeverBlock.WATER) return -1;
            return a[2] - b[2];
        });
    
        solutionList = solutionList.map(a => a[0]);
        solutionList.push(LeverBlock.CHEST); // last is always chest
    
        return solutionList;
    }
    
    canClickLever(lever) {
        const i = this.getI(lever);
        const solutions = this.getSolutions();
        const times = solutions.get(lever)
        const timeInTicks = parseInt(times[i] * 20);
        const openedWaterTicks = this.getOpenedWaterTicks();
    
        if (openedWaterTicks === -1 && timeInTicks === 0) return true;
        else if (openedWaterTicks === -1) return false;
    
        if (openedWaterTicks + timeInTicks - this.getTickCounter() <= 0) return true;
    
        return false;
    }
    
    getSolutions() {
        return solutionsField.get(WaterSolver.INSTANCE);
    }
    
    getPatternIdentifier() {
        return patternIdentifierField.get(WaterSolver.INSTANCE)
    }
    
    getI(leverBlock) {
        return iField.get(leverBlock);
    }
    
    getLeverPos(leverBlock) {
        const vec3 =  getLeverPosMethod.invoke(leverBlock, null);
        return new BlockPos(vec3.field_72450_a, vec3.field_72448_b, vec3.field_72449_c).toMCBlock();
    }
    
    getTickCounter() {
        return tickCounterField.get(WaterSolver.INSTANCE);
    }
    
    getOpenedWaterTicks() {
        return openedWaterTicksField.get(WaterSolver.INSTANCE);
    }
        
    getAngles(x, y, z) {
    
        const radToDeg = 180 / Math.PI;
        const degToRad = Math.PI / 180;
    
        let currentYaw = Player.getPlayer().field_70177_z;
        let currentPitch = Player.getPlayer().field_70125_A;
    
        let yawToMove = null;
        let pitchToMove = null;
        const ex = Player.getX();
        const ey = Player.getY() + sneakHeight;
        const ez = Player.getZ();
        const tvx = x - ex;
        const tvy = y - ey;
        const tvz = z - ez;
    
        const yaw = currentYaw * degToRad;
        const evx = -Math.sin(yaw);
        const evz = Math.cos(yaw);
    
        yawToMove = Math.atan2(evx * tvz - evz * tvx, evz * tvz + evx * tvx) * radToDeg;
    
        pitchToMove = -Math.atan2(tvy, Math.sqrt(tvx * tvx + tvz * tvz)) * radToDeg - currentPitch;
    
        return [yawToMove, pitchToMove];
    }
}