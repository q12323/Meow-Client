import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");

const P1BOX = {
    min: [32, 213, 10],
    max: [114, 252, 86]
};

// crystal
const RIGHTCRYSTAL = [64.50, 238.375, 50.50];
const LEFTCRYSTAL = [82.50, 238.375, 50.50];

// armorstand
const RIGHTPLACE = [52.50, 223.50, 41.50];
const LEFTPLACE = [94.50, 223.50, 41.50];

const EntityEnderCrystal = Java.type("net.minecraft.entity.item.EntityEnderCrystal");
const EntityArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand");

export class CrystalAuraModule extends Module {

    static range = new PropertyNumber("range", 3, 3, 8);
    static delay = new PropertyInteger("delay", 7, 1, 20);

    constructor() {
        super("CrystalAura", false, 0, false);

        this.timer = 0;

        this.triggers.add(register(TickEvent.ClientTickEvent, (event) => this.onTick(event)).unregister());
    }

    onTick(event) {
        if (event.phase !== TickEvent.Phase.END) return;
        if (!Player.getPlayer() || !World.getWorld()) return;
        if (!this.isToggled()) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        // p1 check
        if (
            Player.getX() > P1BOX.max[0] || Player.getX() < P1BOX.min[0] ||
            Player.getY() > P1BOX.max[1] || Player.getY() < P1BOX.min[1] ||
            Player.getZ() > P1BOX.max[2] || Player.getZ() < P1BOX.min[2]
        ) return;
        if (this.timer > 0) {
            this.timer--;
            return;
        }

        const crystalSlot = ChatLib.removeFormatting(String(Player?.getInventory().getItems()[8]?.getName()));
        
        let mop = null;
        let distance = CrystalAuraModule.range.getValue();
        const eyePos = Player.asPlayerMP().getEyePosition(1);

        if (crystalSlot === "Energy Crystal") {
            // place
            const armorstands = World.getAllEntitiesOfType(EntityArmorStand);

            for (let armorstand of armorstands) {
                let coords = [armorstand.getX(), armorstand.getY(), armorstand.getZ()];
                if (!this.equals(coords, RIGHTPLACE) && !this.equals(coords, LEFTPLACE)) continue;

                let name = ChatLib.removeFormatting(armorstand.getName());
                if (name !== "Energy Crystal Missing") continue;

                let m = McUtils.getClosesetMOPOnEntity(eyePos, armorstand.getEntity());
                // console.log(armorstand.getEntity());
                if (!m) continue;

                let dist = McUtils.getDistance3D(eyePos, m.field_72307_f);
                if (dist > distance) continue;

                mop = m;
                distance = dist;
            }
        } else {
            // pick
            const crystals = World.getAllEntitiesOfType(EntityEnderCrystal);

            for (let crystal of crystals) {
                let coords = [crystal.getX(), crystal.getY(), crystal.getZ()];
                if (!this.equals(coords, RIGHTCRYSTAL) && !this.equals(coords, LEFTCRYSTAL)) continue;
                
                let m = McUtils.getClosesetMOPOnEntity(eyePos, crystal.getEntity());
                if (!m) continue;

                let dist = McUtils.getDistance3D(eyePos, m.field_72307_f);
                if (dist > distance) continue;
                
                mop = m;
                distance = dist;

            }
        }

        if (!mop) return;

        McUtils.useEntity(mop);
        this.timer = CrystalAuraModule.delay.getValue() - 1;
    }

    // why js has no array.equals
    equals(crds1, crds2) {
        return crds1[0] === crds2[0] && crds1[1] === crds2[1] && crds1[2] === crds2[2];
    }

    
}
