import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const S3EPacketTeams = Java.type("net.minecraft.network.play.server.S3EPacketTeams");
const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat");
const keyBindDrop = KeyBindingUtils.gameSettings.field_74316_C;

const WISH_DELAY = 10000;
const MAXOR_WISH = "⚠ Maxor is enraged! ⚠";
const GOLDOR_WISH = "[BOSS] Goldor: You have done it, you destroyed the factory…";

const BOSS_BOX = {
    min: [-8, 0, -8],
    max: [134, 254, 147]
};

const GuiContainer = Java.type("net.minecraft.client.gui.inventory.GuiContainer");
const mc = McUtils.mc;

const HEALER_MESSAGES = [
    /^Used Healing Circle!$/,
    /^Your Healer stats are doubled because you are the only player using this class!$/,
    /^Wish is ready to use! Press DROP to activate it!$/,
    /^Healing Circle is now available!$/,
    /^Your Healer ULTIMATE Wish is now available!$/,
    /^You formed a tether with .+!$/,
    /^\[Healer\] Renew Healing .+%$/,
    /^\[Healer\] Healing Aura Healing .+%$/,
    /^\[Healer\] Ghost Healing Aura Healing .+%$/,
    /^\[Healer\] Revive Cooldown .+\d$/,
    /^\[Healer\] Overheal Maximum Shield .+%$/,
    /^\[Healer\] Healing Aura Range .+\d$/,
    /^Healer Milestone .+s$/,
    /^Your Wish healed you for .+ health and granted you an absorption shield with .+ health!$/,
    /^Your Wish healed your entire team for .+ health and shielded them for .+!$/,
]

const OTHER_CLASS_MESSAGES = [
    /^Your Tank stats are doubled because you are the only player using this class!$/,
    /^Thunderstorm is ready to use! Press DROP to activate it!$/,
    /^Used Thunderstorm!$/,
    /^Guided Sheep is now available!$/,
    /^Used Guided Sheep!$/,
    /^Your Mage stats are doubled because you are the only player using this class!$/,
    /^\[Mage\] Intelligence .+\d$/,
    /^\[Mage\] Cooldown Reduction .+%$/,
    /^Your Berserk stats are doubled because you are the only player using this class!$/,
    /^\[Berserk\] Melee Damage .+%$/,
    /^\[Berserk\] Walk Speed .+\d$/,
    /^\[Berserk\] Bloodlust Damage .+%$/,
    /^\[Berserk\] Lust For Blood Damage Increase Cap .+%$/,
    /^\[Berserk\] Lust For Blood Damage Increase Per Hit .+%$/,
    /^\[Berserk\] Indomitable Strength to Defense .+%$/,
    /^\[Berserk\] Weapon Master Swing Range Increase .+\d$/,
    /^\[Berserk\] Bloodlust Heal Percent .+%$/,
    /^\[Berserk\] Bloodlust Duration .+\d$/,
    /^Ragnarok is ready to use! Press DROP to activate it!$/,
    /^Used Ragnarok!$/,
    /^Used Throwing Axe!$/,
    /^Throwing Axe is now available!$/,
    /^Your Berserk ULTIMATE Ragnarok is now available!$/,
    /^Your Archer stats are doubled because you are the only player using this class!$/,
    /^\[Archer\] Extra Arrow Chance .+%$/,
    /^\[Archer\] Arrow Damage .+%$/,
    /^Used Rapid Fire!$/,
    /^Used Explosive Shot!$/,
    /^Explosive Shot is now available!$/,
    /^Your Archer ULTIMATE Rapid Fire is now available!$/,
    /^Rapid Fire is ready to use! Press DROP to activate it!$/,
    /^Your bone plating reduced the damage you took by .+!$/,
    /^\[Tank\] Defense .+\d$/,
    /^\[Tank\] Total Defense .+%$/,
    /^\[Tank\] Absorption Health .+\d$/,
    /^\[Tank\] Absorption Shield Health Required .+%$/,
    /^\[Tank\] Absorption Shield Percentage .+%$/,
    /^\[Tank\] Barrier Cooldown .+\d$/,
    /^Castle of Stone is ready to use! Press DROP to activate it!$/,
    /^Used Castle of Stone!$/,
    /^Used Seismic Wave!$/,
    /^Your Tank ULTIMATE Castle of Stone is now available!$/,
    /^Seismic Wave is now available!$/,
    /^Archer Milestone .+s$/,
    /^Berserk Milestone .+s$/,
    /^Mage Milestone .+s$/,
    /^Tank Milestone .+s$/
]

export class AutoWishModule extends Module {

    static lowHP = new PropertyBoolean("low-HP", true);
    static maxor = new PropertyBoolean("maxor", true);
    static goldor = new PropertyBoolean("goldor", true);
    static healerCheck = new PropertyBoolean("healer-check", true);

    constructor() {
        super("AutoWish", false, 0, false);

        this.isHealer = false;
        this.classUpdated = false;
        this.lastWishTime = Date.now();

        this.triggers.add(register("WorldLoad", () => this.onWorldLoad()).unregister());
        this.triggers.add(register("PacketReceived", (packet) => this.onChat(packet)).setFilteredClass(S02PacketChat).unregister());
        this.triggers.add(register("PacketReceived", (packet) => this.onTeamsPacketReceived(packet)).setFilteredClass(S3EPacketTeams).unregister());
    }

    setToggled(toggled) {
        const name = Player.getName();
        let index = TabList?.getNames()?.findIndex((line) => {
            line = ChatLib.removeFormatting(line);
            if (!line.includes(name)) return false;
            return line.match(/^\[\d+\] .+ \(Healer .+\)$/);
        });

        this.isHealer = !isNaN(index) && index !== -1;
        this.classUpdated = false;
        super.setToggled(toggled);
    }

    onWorldLoad() {
        this.classUpdated = false;
    }

    onChat(packet) {
        if (packet.func_179841_c() === 2) return;
        const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c());
        this.updateClass(message);
        if (AutoWishModule.healerCheck.getValue() && !this.isHealer) return;
        if ((AutoWishModule.maxor.getValue() && message === MAXOR_WISH) || (AutoWishModule.goldor.getValue() && message === GOLDOR_WISH)) {
            this.useWish();
        }
    }

    onTeamsPacketReceived(packet) {
        if (!AutoWishModule.lowHP.getValue()) return;
        if (mc.field_71462_r instanceof GuiContainer) return;
        if (AutoWishModule.healerCheck.getValue() && !this.isHealer) return;
        const teamName = packet.func_149312_c();
        if (!teamName.match(/^team_\d+$/)) return;
        const teamateStatus = packet.func_149311_e() + packet.func_149309_f();
        // when not low
        if (!teamateStatus.match(/^§e\[.\] §.+ §c/)) return;
        // ignore death
        if (teamateStatus.match(/^§e\[.\] §.+ §cD/)) return;
        if (this.isInBoss()) return;
        this.useWish();
    }

    updateClass(message) {
        if (this.classUpdated) return;
        if (HEALER_MESSAGES.some(r => message.match(r))) this.isHealer = true;
        else if (OTHER_CLASS_MESSAGES.some(r => message.match(r))) this.isHealer = false;
        else return;
        this.classUpdated = true;
        
    }

    isInBoss() {
        const x = Player.getX();
        const y = Player.getY();
        const z = Player.getZ();
        return x < BOSS_BOX.max[0] && x > BOSS_BOX.min[0] &&
        y < BOSS_BOX.max[1] && y > BOSS_BOX.min[1] &&
        z < BOSS_BOX.max[2] && z > BOSS_BOX.min[2];
    }

    useWish() {
        if (!SkyblockUtils.isInSkyblock()) return;
        if (Date.now() - this.lastWishTime < WISH_DELAY) return;
        const dropkey = keyBindDrop.func_151463_i()
        KeyBindingUtils.setKeyState(dropkey, true);
        KeyBindingUtils.setKeyState(dropkey, KeyBindingUtils.isKeyDown(dropkey));
        this.lastWishTime = Date.now();
    }
}