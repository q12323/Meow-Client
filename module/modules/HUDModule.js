import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { PropertyPercentage } from "../../property/properties/PropertyPercentage";
import { PropertyRgb } from "../../property/properties/PropertyRgb";
import { PropertyString } from "../../property/properties/PropertyString";
import { McUtils } from "../../utils/McUtils";
import { RenderUtils } from "../../utils/RenderUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";
import { ModuleList } from "../ModuleList";

const Color = Java.type("java.awt.Color");
const mc = McUtils.mc;
const ScaledResolution = Java.type("net.minecraft.client.gui.ScaledResolution");
const GRAYRGB = -5592406;

export class HUDModule extends Module {

    static color = new PropertyString("color", "CUSTOM", ["CUSTOM", "RAINBOW", "COLORFUL", "CHROMA"]);
    static customColor = new PropertyRgb("custom-color", "FFFFFF");
    static saturaion = new PropertyPercentage("saturation", 50, 0, 100);
    static brightness = new PropertyPercentage("brightness", 100, 0, 100);
    static positionX = new PropertyString("position-x", "LEFT", ["LEFT", "RIGHT"]);
    static positionY = new PropertyString("position-y", "TOP", ["TOP", "BOTTOM"]);
    static offsetX = new PropertyInteger("offset-x", 0, 0, 255);
    static offsetY = new PropertyInteger("offset-y", 0, 0, 255);
    static scale = new PropertyNumber("scale", 1, 0.5, 1.5);
    static background = new PropertyPercentage("background", 25, 0, 100);
    static bar = new PropertyBoolean("bar", true);
    static shadow = new PropertyBoolean("shadow", true);
    static toggleSounds = new PropertyBoolean("toggle-sounds", true);
    static toggleAlerts = new PropertyBoolean("toggle-alerts", true);
    static forceSkyblock = new PropertyBoolean("force-skyblock", false);



    constructor() {
        super("HUD", false, 0, true);

        this.modules = new Array();

        HUDModule.forceSkyblock.onProperty((value) => {
            SkyblockUtils.forceSkyblock = value;
        });

        this.triggers.add(register("Tick", () => this.onTick()).unregister());
        this.triggers.add(register("RenderOverlay", () => this.onRenderOverlay()).unregister());
    }

    static getColor(time, offset) {
        let rainbow = 0;
        switch(HUDModule.color.getValue()) {
            case "CUSTOM":
                return HUDModule.customColor.getColor();

            case "RAINBOW":
                rainbow = RenderUtils.getRainbowColor(Number.MAX_SAFE_INTEGER - time, offset * 3, 5000, HUDModule.saturaion.getValue() * 0.01, HUDModule.brightness.getValue() * 0.01);
                break;

            case "COLORFUL":
                rainbow = RenderUtils.getRainbowColor(Number.MAX_SAFE_INTEGER - time , offset * 3 + offset % 3 * 13, 5000, HUDModule.saturaion.getValue() * 0.01, HUDModule.brightness.getValue() * 0.01);
                break;

            case "CHROMA":
                rainbow = RenderUtils.getRainbowColor(Number.MAX_SAFE_INTEGER - time, 0, 5000, HUDModule.saturaion.getValue() * 0.01, HUDModule.brightness.getValue() * 0.01);
                break;

        }

        return new Color(rainbow[0] / 255, rainbow[1] / 255, rainbow[2] / 255, rainbow[3] / 255);
    }

    getWidth(name, suffix) {
        chars = name;
        for (let str of suffix) {
            chars += " " + str;
        }
        return mc.field_71466_p.func_78256_a(chars);
    }

    onTick() {
        if (!this.isToggled()) return;
        this.modules = new Array();
        
        const modules = Object.values(ModuleList.getModules());
        
        for (let module of modules) {
            if (module.isToggled() && !module.isHidden()) {
                this.modules.push(module);
            }
        }
        if (this.modules.length > 0) {
            this.modules.sort((a, b) => 
                this.getWidth(b.getName(), b.getSuffix()) - this.getWidth(a.getName(), a.getSuffix())
            );
        }
        // this.modules.sort((a, b) => b - a);
    }

    onRenderOverlay() {
        if (!this.isToggled()) return;
        const offsetX = HUDModule.offsetX.getValue();
        const offsetY = HUDModule.offsetY.getValue();
        const positionX = HUDModule.positionX.getValue();
        const positionY = HUDModule.positionY.getValue();
        const bar = HUDModule.bar.getValue();
        const shadow = HUDModule.shadow.getValue();
        const scale = HUDModule.scale.getValue();
        const background = HUDModule.background.getValue();
        
        let x = (1 + (offsetX) + (bar ? (shadow ? 2 : 1) : 0)) * scale;
        let y = (1 + (offsetY)) * scale;

        if (positionX === "RIGHT") {
            x = new ScaledResolution(mc).func_78326_a() - x;
        }

        if (positionY === "BOTTOM") {
            y = new ScaledResolution(mc).func_78328_b() - y - 8 * scale;
        }

        GlStateManager.func_179094_E();
        GlStateManager.func_179152_a(scale, scale, 1);

        const time = Date.now();
        let i = 0;

        for (let module of this.modules) {
            i++;
            let name = module.getName();
            let suffix = module.getSuffix();
            let width = this.getWidth(name, suffix) - (shadow ? 0 : 1);
            let rgb = HUDModule.getColor(time, i).getRGB();
            if (background > 0) {
                RenderUtils.drawRect(x / scale - 1 - (positionX === "LEFT" ? 0 : width), y / scale - (positionY === "TOP" ? 0 : (shadow ? 1 : 0)), x / scale + 1 + (positionX === "LEFT" ? width : 0), y / scale + 8 + (positionY === "TOP" ? (shadow ? 1 : 0) : 0), (new Color(0, 0, 0, background / 100).getRGB()));
            }

            if (bar) {
                if (shadow) {
                    RenderUtils.drawRect(x / scale + (positionX === "LEFT" ? -3 : 1), y / scale - (positionY === "TOP" ? 0 : 1), x / scale + (positionX === "LEFT" ? -2 : 2), y / scale + 8 + (positionY === "TOP" ? 1 : 0), rgb);
                    RenderUtils.drawRect(x / scale + (positionX === "LEFT" ? -2 : 2), y / scale - (positionY === "TOP" ? 0 : 1), x / scale + (positionX === "LEFT" ? -1 : 3), y / scale + 8 + (positionY === "TOP" ? 1 : 0), (rgb & 16579836) >> 2 | rgb & -16777216);
                } else {
                    RenderUtils.drawRect(x / scale + (positionX === "LEFT" ? -2 : 1), y / scale - (positionY === "TOP" ? 0 : 0), x / scale + (positionX === "LEFT" ? -1 : 2), y / scale + 8 + (positionY === "TOP" ? 1 : 0), rgb);
                }
            }

            if (shadow) {
                mc.field_71466_p.func_175063_a(name, x / scale - (positionX === "RIGHT" ? width : 0), y / scale, rgb);
            } else {
                mc.field_71466_p.func_78276_b(name, x / scale - (positionX === "RIGHT" ? width : 0), y / scale + (positionY === "BOTTOM" ? 1 : 0), rgb);
            }

            if (suffix.length > 0) {
                let offset = mc.field_71466_p.func_78256_a(name) + 3;
                let sfxs = module.getSuffix();
                let length = sfxs.length;
                for (let i = 0; i < length; ++i) {
                    let sfx = sfxs[i];
                    if (shadow) {
                        mc.field_71466_p.func_175063_a(sfx, x / scale - (positionX === "RIGHT" ? width : 0) + offset, y / scale, GRAYRGB);
                    } else {
                        mc.field_71466_p.func_78276_b(sfx, x / scale - (positionX === "RIGHT" ? width : 0) + offset, y / scale + (positionY === "BOTTOM" ? 1 : 0), GRAYRGB);
                    }

                    offset += mc.field_71466_p.func_78256_a(sfx) + (shadow ? 3 : 2);
                }
            }

            y += (8 + (shadow ? 1 : 0)) * scale * (positionY === "TOP" ? 1 : -1);
        }

        GlStateManager.func_179121_F();
    }

    getSuffix() {
        const color = HUDModule.color.getValue();
        return [color.charAt(0) + color.slice(1).toLowerCase()];
    }

}
/*
register("Step", () => {
    SkyblockUtils.forceSkyblock = HUDModule.forceSkyblock.getValue();
}).setFps(2);*/
