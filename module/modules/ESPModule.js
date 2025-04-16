import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { PropertyRgb } from "../../property/properties/PropertyRgb";
import { PropertyString } from "../../property/properties/PropertyString";
import { McUtils } from "../../utils/McUtils";
import { RenderUtils } from "../../utils/RenderUtils";
import { Module } from "../Module";
import { HUDModule } from "./HUDModule";

const MCEntityLivingBase = Java.type("net.minecraft.entity.EntityLivingBase");
const EntityArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand");
const EntityPlayer = Java.type("net.minecraft.entity.player.EntityPlayer");
const EntityWither = Java.type("net.minecraft.entity.boss.EntityWither");
const EntityEnderman = Java.type("net.minecraft.entity.monster.EntityEnderman");
const EntityZombie = Java.type("net.minecraft.entity.monster.EntityZombie");
const EntitySkeleton = Java.type("net.minecraft.entity.monster.EntitySkeleton");

// const GLU = Java.type("org.lwjgl.util.glu.GLU");
const Project = Java.type("org.lwjgl.util.glu.Project");
const ScaledResolution = Java.type("net.minecraft.client.gui.ScaledResolution");
const BufferUtils = Java.type("org.lwjgl.BufferUtils");
// const GLAllocation = Java.type("net.minecraft.client.renderer.GLAllocation");
const Color = Java.type("java.awt.Color");
const mc = McUtils.mc;
const RenderGlobal = Java.type("net.minecraft.client.renderer.RenderGlobal");

const viewport = BufferUtils.createIntBuffer(16);
const modelView = BufferUtils.createFloatBuffer(16);
const projection = BufferUtils.createFloatBuffer(16);

let camX;
let camY;
let camZ;
let height;

let count = 0;

export class ESPModule extends Module {

    static legit = new PropertyBoolean("legit", false);
    static mode = new PropertyString("mode", "3D", ["3D", "2D"]);
    static color = new PropertyString("color", "HUD", ["HUD", "CUSTOM"]);
    static customColor = new PropertyRgb("custom-color", "FFFFFF");
    static box = new PropertyBoolean("box", true);
    static outline = new PropertyBoolean("outline", false);
    static healthBar = new PropertyBoolean("health-bar", false);
    static expand = new PropertyNumber("expand", 0, 0, 1);
    static distance = new PropertyInteger("distance", 50, 10, 500);
    static alpha = new PropertyInteger("alpha", 50, 0, 255);
    static width = new PropertyNumber("width", 2, 0, 10);
    static player = new PropertyBoolean("player", false);
    static starMobs = new PropertyBoolean("star-mobs", true);
    static shadowAssassin = new PropertyBoolean("shadow-assassin", true);
    static wither = new PropertyBoolean("wither", true);
    static armorStand = new PropertyBoolean("armor-stand", false);

    constructor() {
        super("ESP", false, 0, false);

        this.targets = new Set();
        this.entitiesMinMax = new Set();

        this.triggers.add(register("Step", () => {this.onStep()}).setFps(2).unregister());
        this.triggers.add(register("RenderOverlay", () => {this.onRenderOverlay()}).unregister());
        this.triggers.add(register("RenderWorld", () => {this.onRenderWorld()}).unregister());
    }

    onStep() {
        if (!this.isToggled()) return;
        this.targets = new Set();
        const starMob = ESPModule.starMobs.getValue();
        const armorStand = ESPModule.armorStand.getValue();
        const sa = ESPModule.shadowAssassin.getValue();
        const wither = ESPModule.wither.getValue();
        const player = ESPModule.player.getValue();
        this.armorStands = World.getAllEntitiesOfType(EntityArmorStand);
        this.players = World.getAllEntitiesOfType(EntityPlayer);
        this.withers = World.getAllEntitiesOfType(EntityWither);
        this.zombies = World.getAllEntitiesOfType(EntityZombie);
        this.endermans = World.getAllEntitiesOfType(EntityEnderman);
        this.skeletons = World.getAllEntitiesOfType(EntitySkeleton);

        new Thread(() => {
            if (starMob || armorStand) {
                for (let entity of this.armorStands) {
                    if (starMob && this.isStarMob(entity)) {
                        let found = this.getDungeonMobByCustomNametag(entity);
                        if (found !== null) {
                            this.addTarget(found);
                        }
                    }

                    if (armorStand/* && !entity.isInvisible()*/) {
                        this.addTarget(entity);
                    }
                }
            }

            if (player || sa) {
                for (let entity of this.players) {
                    if (entity.getEntity() === Player.getPlayer()) continue;
                    if (player) {
                        this.addTarget(entity);
                        continue;
                    }

                    if (sa && this.isSA(entity)) {
                        this.addTarget(entity);
                    }
                }
            }

            if (wither) {
                for (let entity of this.withers) {
                    if (!entity.isInvisible() && entity.getEntity().func_82212_n() < 800) {
                        this.addTarget(entity);
                    }
                }
            }
        }).start()
        
    }

    // draw 2d esp
    onRenderOverlay() {
        if (!this.isToggled()) return;
        if (ESPModule.mode.getValue() === "2D") {
            GlStateManager.func_179094_E(); // pushMatrix
            GlStateManager.func_179090_x(); // disableTexture2D
            GlStateManager.func_179147_l(); // enableBlend
            GL11.glBlendFunc(770, 771);
            GL11.glEnable(2848);
            GL11.glLineWidth(ESPModule.width.getValue());
            let i = 0;
            let color = new Color(1, 1, 1);
            for (let minMax of this.entitiesMinMax) {
                i++;
                switch(ESPModule.color.getValue()) {
                    case "HUD":
                        let hudColor = HUDModule.getColor(Date.now(), i);
                        color = new Color(hudColor.getRed() / 255, hudColor.getGreen() / 255, hudColor.getBlue() / 255, ESPModule.alpha.getValue() / 255);
                        break;
    
                    case "CUSTOM":
                        let customColor = ESPModule.customColor.getColor()
                        color = new Color(customColor.getRed() / 255, customColor.getGreen() / 255, customColor.getBlue() / 255, ESPModule.alpha.getValue() / 255);
                        break;

                }
                
                if (ESPModule.box.getValue()) {
                    RenderUtils.glColor(color.getRGB());
                    // this.drawRect(...minMax);
                    this.drawRect(minMax[0], minMax[1], minMax[2], minMax[3]);
                }
                if (ESPModule.outline.getValue()) {
                    RenderUtils.glColor(new Color(color.getRed() / 255, color.getGreen() / 255, color.getBlue() / 255).getRGB());
                    this.drawBorder(minMax[0], minMax[1], minMax[2], minMax[3]);
                }
            }
            RenderUtils.glResetColor();
            GL11.glLineWidth(2.0);
            GL11.glDisable(2848);
            GlStateManager.func_179084_k(); // disableBlend
            GlStateManager.func_179098_w(); // enableTexture2D
            GlStateManager.func_179121_F(); // popMatrix

        }

    }

    onRenderWorld() {
        if (!this.isToggled()) return;
        const expand = ESPModule.expand.getValue();
        const box = ESPModule.box.getValue();
        const outline = ESPModule.outline.getValue();
        const legit = ESPModule.legit.getValue();
        const healthBar = ESPModule.healthBar.getValue();
        const width = ESPModule.width.getValue();
        const x = Player.getRenderX();
        const y = Player.getRenderY();
        const z = Player.getRenderZ();
        switch(ESPModule.mode.getValue()) {
            // draw 3d esp
            case "3D":
                GlStateManager.func_179094_E(); // pushMatrix
                if (!legit) GlStateManager.func_179097_i(); // disableDepth
                GlStateManager.func_179090_x(); // disableTexture2D
                GlStateManager.func_179147_l(); // enableBlend
                GL11.glEnable(2848);
                GL11.glLineWidth(width);
                

                let i = 0;
                let color = new Color(1, 1, 1);
                for (let target of this.targets) {
                    i++;
                    switch(ESPModule.color.getValue()) {
                        case "HUD":
                            let hudColor = HUDModule.getColor(Date.now(), i);
                            color = new Color(hudColor.getRed() / 255, hudColor.getGreen() / 255, hudColor.getBlue() / 255, ESPModule.alpha.getValue() / 255);
                            break;
        
                        case "CUSTOM":
                            let customColor = ESPModule.customColor.getColor();
                            color = new Color(customColor.getRed() / 255, customColor.getGreen() / 255, customColor.getBlue() / 255, ESPModule.alpha.getValue() / 255);
                            break;

                    }

                    let entityBox = target.getEntity().func_174813_aQ().func_72314_b(expand, expand, expand).func_72317_d(target.getRenderX() - target.getX(), target.getRenderY() - target.getY(), target.getRenderZ() - target.getZ()).func_72317_d(-x, -y, -z);

                    if (box) {
                        this.drawFilledEntityESP(entityBox, color.getRed(), color.getGreen(), color.getBlue(), color.getAlpha());
                    }
                    if (outline) {
                        this.drawOutlinedEntityESP(entityBox, color.getRed(), color.getGreen(), color.getBlue(), 255);
                    }
                }

                GL11.glLineWidth(2);
                GL11.glDisable(2848);
                GlStateManager.func_179084_k(); // disableBlend
                GlStateManager.func_179098_w(); // enableTexture2D
                if (!legit) GlStateManager.func_179126_j(); // enableDepth
                GlStateManager.func_179121_F(); // popMatrix

                break;

            // calculate where 2d esp should be drawn
            case "2D":
                this.entitiesMinMax = new Set();
                this.updateRenderData();
                for (let target of this.targets) {
                    let entityBox = target.getEntity().func_174813_aQ().func_72314_b(expand, expand, expand).func_72317_d(target.getRenderX() - target.getX(), target.getRenderY() - target.getY(), target.getRenderZ() - target.getZ());

                    let minX = entityBox.field_72340_a;
                    let maxX = entityBox.field_72336_d;
                    let minY = entityBox.field_72338_b;
                    let maxY = entityBox.field_72337_e;
                    let minZ = entityBox.field_72339_c;
                    let maxZ = entityBox.field_72334_f;

                    let points = [
                        [minX, minY, minZ],
                        [maxX, minY, minZ],
                        [minX, maxY, minZ],
                        [minX, minY, maxZ],
                        [maxX, maxY, minZ],
                        [maxX, minY, maxZ],
                        [minX, maxY, maxZ],
                        [maxX, maxY, maxZ]
                    ]

                    let minScreenX = Number.MAX_SAFE_INTEGER;
                    let minScreenY = Number.MAX_SAFE_INTEGER;
                    let maxScreenX = Number.MIN_SAFE_INTEGER;
                    let maxScreenY = Number.MIN_SAFE_INTEGER;

                    let nullFlag = false;
                    for (let point of points) {
                        point = this.worldToScreen(point[0], point[1], point[2]);
                        if (point === null) {
                            nullFlag = true;
                            break;
                        }

                        let [px, py] = point;
                        if (px < minScreenX) minScreenX = px;
                        if (py < minScreenY) minScreenY = py;
                        if (px > maxScreenX) maxScreenX = px;
                        if (py > maxScreenY) maxScreenY = py;
                    }

                    if (nullFlag) continue;

                    
                    this.entitiesMinMax.add([minScreenX * 0.5, minScreenY * 0.5, maxScreenX * 0.5, maxScreenY * 0.5]);

                }

                break;

        }

        // draw health bar
        if (healthBar && !legit) {
            for (let target of this.targets) {
                let mcTarget = target.getEntity();
                if (!(mcTarget instanceof MCEntityLivingBase)) continue;
                GlStateManager.func_179094_E(); // pushMatrix
                GlStateManager.func_179097_i(); // disableDepth
                GlStateManager.func_179137_b(target.getRenderX() - x, target.getRenderY() - y, target.getRenderZ() - z);
                GlStateManager.func_179114_b(-mc.func_175598_ae().field_78735_i, 0, 1, 0);
                GlStateManager.func_179090_x(); // disableTexture2D
                GlStateManager.func_179147_l(); // enableBlend
                GL11.glBlendFunc(770, 771);
                GL11.glEnable(2848);

                let height = mcTarget.field_70131_O + 0.18;
                let hp = Math.ceil(mcTarget.func_110143_aJ() + mcTarget.func_110139_bj());
                let health = Math.min(Math.max(hp / mcTarget.func_110138_aP(), 0), 1);
                RenderUtils.glColor(Color.black.getRGB());
                this.drawRect(0.66, height - 0.03, 0.75, height);
                RenderUtils.glColor(Color.black.getRGB());
                this.drawRect(0.66, 0, 0.75, 0.03);
                RenderUtils.glColor(Color.black.getRGB());
                this.drawRect(0.63, 0, 0.66, height);
                RenderUtils.glColor(Color.black.getRGB());
                this.drawRect(0.75, 0, 0.78, height);
                RenderUtils.glColor(Color.darkGray.getRGB());
                this.drawRect(0.66, (height - 0.03) * health, 0.75, height - 0.03);
                RenderUtils.glColor(RenderUtils.getHealthColor(health).getRGB());
                this.drawRect(0.66, 0.03, 0.75, (height - 0.03) * health);

    
                RenderUtils.glResetColor();
                GL11.glDisable(2848);
                GlStateManager.func_179084_k(); // disableBlend
                GlStateManager.func_179098_w(); // enableTexture2D
                GlStateManager.func_179126_j(); // enableDepth
                GlStateManager.func_179121_F(); // popMatrix

            }

        }
    }

    addTarget(entity) {
        if (entity === null || entity.getEntity() === null || entity.getEntity() === undefined) return;
        if (Player.getPlayer().func_70032_d(entity.getEntity()) > ESPModule.distance.getValue()) return;
        this.targets.add(entity);
    }

    isSA(entity) {
        return (entity.getEntity() instanceof EntityPlayer) && ChatLib.removeFormatting(entity.getName()).includes("Shadow Assassin");
    }

    isStarMob(entity) {
        return entity.getName().includes("§6✯");
    }

    getDungeonMobByCustomNametag(nametag) {
        let type = 0;
        const name = ChatLib.removeFormatting(nametag.getName()).toLowerCase();
        // zombie: 1
        // skeleton: 2
        // enderman: 3
        // player: 4

        if ((name.includes("zombie") && !name.includes("commander")) || name.includes("lurker")) type = 1;
        else if (name.includes("skeleton") || name.includes("archer") || name.includes("sniper")) type = 2;
        else if (name.includes("wither")) type = 2;
        else if (name.includes("fels")) type = 3;
        else if (name.includes("souleater") || name.includes("dreadlord") || name.includes("adventurer") || name.includes("archaeologist") || name.includes("commander")) type = 4;
        else return null;
        let distance = 0.5;
        let entity = null;
        const x = nametag.getX();
        const y = nametag.getY();
        const z = nametag.getZ();
        
        const entities = (() => {
            switch(type) {
                case 1:
                    return this.zombies

                case 2:
                    return this.skeletons

                case 3:
                    return this.endermans

                case 4:
                    return this.players
            }
        })()

        for (let ent of entities) {
            if (ent.getEntity() === Player.getPlayer()) continue;

            if (y - ent.getY() < 5 && y - ent.getY() > -1) {
                let dist = Math.sqrt((x - ent.getX()) ** 2 + (z - ent.getZ()) ** 2);
                if (dist < distance) {
                    distance = dist;
                    entity = ent;
                }
            }
        }

        return entity;
    }

    updateRenderData() {
        GL11.glGetFloat(GL11.GL_MODELVIEW_MATRIX, modelView);
        GL11.glGetFloat(GL11.GL_PROJECTION_MATRIX, projection);
        GL11.glGetInteger(GL11.GL_VIEWPORT, viewport);

        const renderManager = Renderer.getRenderManager();

        camX = renderManager.field_78730_l;
        camY = renderManager.field_78731_m;
        camZ = renderManager.field_78728_n;

        const scaledResolution = new ScaledResolution(mc);
        height = scaledResolution.func_78328_b();
    }

    worldToScreen(x, y, z) {
        const screenCoords = BufferUtils.createFloatBuffer(3);

        x -= camX;
        y -= camY;
        z -= camZ;

        if (Project.gluProject(x, y, z, modelView, projection, viewport, screenCoords)) {
            const screenX = screenCoords.get(0);
            const screenY = screenCoords.get(1);
            const screenZ = screenCoords.get(2);
            if (screenZ > 0 && screenZ < 1) {
                return [screenX, height * 2 - screenY];
            }
    
        }
        return null;
    }

    // optimized functions only for esp
    drawFilledEntityESP(entityBox, r, g, b, a) {
        RenderUtils.drawFilledBoundingBox(entityBox, r, g, b, a)
    }
    
    drawOutlinedEntityESP(entityBox, r, g, b, a) {
        RenderGlobal.func_181563_a(entityBox, r, g, b, a);
    }

    drawRect(x, y, x2, y2) {
        GL11.glBegin(7);
        GL11.glVertex2d(x2, y);
        GL11.glVertex2d(x, y);
        GL11.glVertex2d(x, y2);
        GL11.glVertex2d(x2, y2);
        GL11.glEnd();
    }

    drawBorder(x, y, x2, y2) {
        GL11.glBegin(1);
        GL11.glVertex2d(x, y);
        GL11.glVertex2d(x, y2);
        GL11.glVertex2d(x2, y2);
        GL11.glVertex2d(x2, y);
        GL11.glVertex2d(x, y);
        GL11.glVertex2d(x2, y);
        GL11.glVertex2d(x, y2);
        GL11.glVertex2d(x2, y2);
        GL11.glEnd();
    }
    
    getSuffix() {
        return [ESPModule.mode.getValue()];
    }
}
