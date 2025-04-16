const mc = Client.getMinecraft();
const TessellatorClass = Java.type("net.minecraft.client.renderer.Tessellator");
const DefaultVertexFormats = Java.type("net.minecraft.client.renderer.vertex.DefaultVertexFormats");
const RenderGlobal = Java.type("net.minecraft.client.renderer.RenderGlobal");
const Color = Java.type("java.awt.Color");

const GuiField = Java.type("net.minecraft.client.gui.Gui");

// meow
export class RenderUtils {

    static color = Color;

    static getRainbowColor(time, offset, speed, saturation, brightness) {
        const rainbow = Color.HSBtoRGB(1 - (time + offset * 100) % speed / speed, saturation, brightness);
        // console.log(rainbow)
        // console.log([1 - (time + offset * 100) % speed, saturation, brightness].join(", "))
        const r = rainbow >> 16 & 255;
        const g = rainbow >> 8 & 255;
        const b = rainbow & 255;
        const a = 255;
        // console.log(1 - (time + offset * 100) % speed)
        // console.log([r,g,b,a].join(", "))
        return [r, g, b, a];
    }

    static getGradientColor(percent, color1, color2) {
        return new Color((color1.getRed() + percent * (color2.getRed() - color1.getRed())) / 255, (color1.getGreen() + percent * (color2.getGreen() - color1.getGreen())) / 255, (color1.getBlue() + percent * (color2.getBlue() - color1.getBlue())) / 255);
    }

    static getHealthColor(health) {
        if (health >= 1) {
            return Color.green;
        } else if (health >= 0.7) {
            return RenderUtils.getGradientColor((health - 0.7) / 0.3, Color.yellow, Color.green);
        } else if (health >= 0.5) {
            return RenderUtils.getGradientColor((health - 0.5) / 0.2, Color.orange, Color.yellow);
        } else if (health >= 0.3) {
            return RenderUtils.getGradientColor((health - 0.3) / 0.2, Color.red, Color.orange);
        } else {
            return health >= 0.0 ? RenderUtils.getGradientColor(health / 0.3, Color.red.darker().darker(), Color.red) : Color.red.darker().darker();
        }

    }

    static drawCircle(r, color, slice = 30, width = 2) {
        const dt = Math.PI * 2 / slice;
        // GL11.glEnable(2848);
        // GL11.glLineWidth(2);
        GlStateManager.func_179090_x(); // disableTexture2D
        GlStateManager.func_179147_l(); // enableBlend
        GL11.glBlendFunc(770, 771);
        GL11.glLineWidth(width);
        RenderUtils.glColor(color);
        GL11.glEnable(2848);
        GL11.glBegin(GL11.GL_LINE_LOOP);
        for (let i = 0; i < slice; i++) {
            let rad = dt * i;
            GL11.glVertex2d(r * Math.cos(rad), r * Math.sin(rad));
        }
        GL11.glEnd();
        RenderUtils.glResetColor();
        GL11.glLineWidth(2.0);
        GL11.glDisable(2848);
        GlStateManager.func_179084_k(); // disableBlend
        GlStateManager.func_179098_w(); // enableTexture2D

    }
    
    static drawRect(x, y, x2, y2, color) {
        // GuiField.func_73734_a(x, y, x2, y2, color);
        // Renderer.drawRect(color, x, y, x2 - x, y2 - y);
        // return;
        // GL11.glDisable(3553);
        GlStateManager.func_179090_x(); // disableTexture2D
        // GL11.glEnable(3042);
        GlStateManager.func_179147_l(); // enableBlend
        GL11.glBlendFunc(770, 771);
        // GlStateManager.func_179112_b(770, 771); // blendFunc
        GL11.glEnable(2848);
        RenderUtils.glColor(color);
        GL11.glBegin(7);
        GL11.glVertex2d(x2, y);
        GL11.glVertex2d(x, y);
        GL11.glVertex2d(x, y2);
        GL11.glVertex2d(x2, y2);
        GL11.glEnd();
        RenderUtils.glResetColor();
        GL11.glDisable(2848);
        GlStateManager.func_179084_k(); // disableBlend
        // GL11.glDisable(3042);
        GlStateManager.func_179098_w(); // enableTexture2D
        // GL11.glEnable(3553);
    }

    static drawBorderedRect(x, y, x2, y2, width, color1, color2) {
        RenderUtils.drawRect(x, y, x2, y2, color1);
        RenderUtils.drawBorder(x, y, x2, y2, width, color2);
    }

    static drawBorder(x, y, x2, y2, width, color) {
        // Renderer.drawLine(color, x, y, x, y2, width);
        // Renderer.drawLine(color, x, y2, x2, y2, width);
        // Renderer.drawLine(color, x2, y2, x2, y, width);
        // Renderer.drawLine(color, x2, y, x, y, width);
        // return
        // GL11.glDisable(3553);
        GlStateManager.func_179090_x(); // disableTexture2D
        // GL11.glEnable(3042); // blending
        GlStateManager.func_179147_l(); // enableBlend
        GL11.glBlendFunc(770, 771);
        GL11.glEnable(2848);
        GL11.glLineWidth(width);
        RenderUtils.glColor(color);
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
        RenderUtils.glResetColor();
        GL11.glLineWidth(2.0);
        GL11.glDisable(2848);
        GlStateManager.func_179084_k(); // disableBlend
        // GL11.glDisable(3042); // blending
        GlStateManager.func_179098_w(); // enableTexture2D
        // GL11.glEnable(3553);
    }

    static drawFilledBoundingBox(axisAlignedBB, r, g, b, a) {
        const tessellator = TessellatorClass.func_178181_a();
        const worldRenderer = tessellator.func_178180_c();
        worldRenderer.func_181668_a(7, DefaultVertexFormats.field_181706_f);
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72340_a, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72339_c).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72337_e, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        worldRenderer.func_181662_b(axisAlignedBB.field_72336_d, axisAlignedBB.field_72338_b, axisAlignedBB.field_72334_f).func_181669_b(r, g, b, a).func_181675_d();
        tessellator.func_78381_a();
    }

    static drawFilledEntityESP(entity, r, g, b, a, expand, partialTicks) {
        const x = RenderUtils.interpolate(entity.field_70165_t, entity.field_70142_S, partialTicks);
        const y = RenderUtils.interpolate(entity.field_70163_u, entity.field_70137_T, partialTicks);
        const z = RenderUtils.interpolate(entity.field_70161_v, entity.field_70136_U, partialTicks);
        const entityBox = entity.func_174813_aQ().func_72314_b(expand, expand, expand).func_72317_d(x - entity.field_70165_t, y - entity.field_70163_u, z - entity.field_70161_v).func_72317_d(-Player.getRenderX(), -Player.getRenderY(), -Player.getRenderZ());
        RenderUtils.drawFilledBoundingBox(entityBox, r, g, b, a)
    }

    static drawOutlinedEntityESP(entity, r, g, b, a, width, expand, partialTicks) {
        GL11.glLineWidth(width);
        const x = RenderUtils.interpolate(entity.field_70165_t, entity.field_70142_S, partialTicks);
        const y = RenderUtils.interpolate(entity.field_70163_u, entity.field_70137_T, partialTicks);
        const z = RenderUtils.interpolate(entity.field_70161_v, entity.field_70136_U, partialTicks);
        const entityBox = entity.func_174813_aQ().func_72314_b(expand, expand, expand).func_72317_d(x - entity.field_70165_t, y - entity.field_70163_u, z - entity.field_70161_v).func_72317_d(-Player.getRenderX(), -Player.getRenderY(), -Player.getRenderZ());
        RenderGlobal.func_181563_a(entityBox, r, g, b, a);
        GL11.glLineWidth(2);
    }

    static interpolate(current, old, scale) {
        return old + (current - old) * scale;
    }

    static argbToRgba(color) {
        const alpha = (color >> 24 & 255) / 255.0;
        const red = (color >> 16 & 255) / 255.0;
        const green = (color >> 8 & 255) / 255.0;
        const blue = (color & 255) / 255.0;
        return [red, green, blue, alpha];
    }

    static rgbaToArgb(r, g, b, a) {
        return (a << 24) | (r << 16) | (g << 8) | b | 0;
    }

    static glColor(color) {
        // alpha = (color >> 24 & 255) / 255.0;
        // red = (color >> 16 & 255) / 255.0;
        // green = (color >> 8 & 255) / 255.0;
        // blue = (color & 255) / 255.0;
        
        GlStateManager.func_179131_c(...RenderUtils.argbToRgba(color));
    }

    static glResetColor() {
        GlStateManager.func_179117_G();
    }
}
