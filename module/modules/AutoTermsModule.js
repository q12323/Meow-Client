import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyString } from "../../property/properties/PropertyString";
import { KeyBindingUtils } from "../../utils/KeyBindingUtils";
import { McUtils } from "../../utils/McUtils";
import { SkyblockUtils } from "../../utils/SkyblockUtils";
import { Module } from "../Module";

const Mouse = Java.type("org.lwjgl.input.Mouse");

const OdinTerminalSolver = Java.type("me.odinmain.features.impl.floor7.p3.TerminalSolver");

const MCItem = Java.type("net.minecraft.item.Item");
const Blocks = Java.type("net.minecraft.init.Blocks");
const GuiScreen = Java.type("net.minecraft.client.gui.GuiScreen");
const GuiChest = Java.type("net.minecraft.client.gui.inventory.GuiChest");
const GuiContainer = Java.type("net.minecraft.client.gui.inventory.GuiContainer");

const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow");
const S2FPacketSetSlot = Java.type("net.minecraft.network.play.server.S2FPacketSetSlot");
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow");
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow");

const JavaInt = Java.type("java.lang.Integer");
const JavaChar = Java.type("java.lang.Character");

const theSlotField = GuiContainer.class.getDeclaredField("field_147006_u");
theSlotField.setAccessible(true);
const keyTypedMethod = GuiContainer.class.getDeclaredMethod("func_73869_a", JavaChar.TYPE, JavaInt.TYPE);
keyTypedMethod.setAccessible(true);

const mouseClickedMethod = GuiScreen.class.getDeclaredMethod("func_73864_a", JavaInt.TYPE, JavaInt.TYPE, JavaInt.TYPE);
const mouseReleasedMethod = GuiScreen.class.getDeclaredMethod("func_146286_b", JavaInt.TYPE, JavaInt.TYPE, JavaInt.TYPE);
mouseClickedMethod.setAccessible(true);
mouseReleasedMethod.setAccessible(true);

const guiLeftField = GuiContainer.class.getDeclaredField("field_147003_i");
const guiTopField = GuiContainer.class.getDeclaredField("field_147009_r");
guiLeftField.setAccessible(true);
guiTopField.setAccessible(true);

const keyDownBufferField = Keyboard.class.getDeclaredField("keyDownBuffer");
keyDownBufferField.setAccessible(true);

const mc = McUtils.mc;

function unpress() {
    const Forward = KeyBindingUtils.gameSettings.field_74351_w.func_151463_i();
    const Left = KeyBindingUtils.gameSettings.field_74370_x.func_151463_i();
    const Back = KeyBindingUtils.gameSettings.field_74368_y.func_151463_i();
    const Right = KeyBindingUtils.gameSettings.field_74366_z.func_151463_i();
    const Jump = KeyBindingUtils.gameSettings.field_74314_A.func_151463_i();
    const Sneak = KeyBindingUtils.gameSettings.field_74311_E.func_151463_i();
    const Sprint = KeyBindingUtils.gameSettings.field_151444_V.func_151463_i();
    KeyBindingUtils.setKeyState(Forward, false);
    KeyBindingUtils.setKeyState(Left, false);
    KeyBindingUtils.setKeyState(Back, false);
    KeyBindingUtils.setKeyState(Right, false);
    KeyBindingUtils.setKeyState(Jump, false);
    KeyBindingUtils.setKeyState(Sneak, false);
    KeyBindingUtils.setKeyState(Sprint, false);
}

export class AutoTermsModule extends Module {

    static mode = new PropertyString("mode", "MIDDLE", ["LEFT", "MIDDLE", "DROP"]);
    static delay = new PropertyInteger("delay", 200, 0, 10000);
    static fcDelay = new PropertyInteger("fc-delay", 350, 0, 10000);
    static retryDelay = new PropertyInteger("retry-delay", 500, 0, 10000);
    static invwalk = new PropertyBoolean("invwalk", false);
    static cancelClicks = new PropertyBoolean("cancel-clicks", false);

    constructor() {
        super("AutoTerms", false, 0, false);

        this.clicking = false;
        this.resetState();

        this.triggers.add(register("Tick", () => this.onTick()).unregister());
        this.triggers.add(register("RenderWorld", (x, y, gui) => this.onGuiRender(x, y, gui)).unregister());
        this.triggers.add(register("GuiMouseClick", (x, y, button, gui, event) => this.onGuiClick(x, y, button, gui, event)).unregister());
        this.triggers.add(register("GuiMouseRelease", (x, y, button, gui, event) => this.onGuiClick(x, y, button, gui, event)).unregister());
        this.triggers.add(register("PacketSent", () => this.resetLastClickedSlot()).setFilteredClass(C0DPacketCloseWindow).unregister());
        this.triggers.add(register("PacketReceived", () => this.resetLastClickedSlot()).setFilteredClass(S2EPacketCloseWindow).unregister());
        this.triggers.add(register("PacketReceived", (packet, event) => this.onOpenWindowPacketReceived(packet, event)).setFilteredClass(S2DPacketOpenWindow).unregister());
        this.triggers.add(register("PacketReceived", (packet ,event) => this.onSetSlotPacketReceived(packet ,event)).setFilteredClass(S2FPacketSetSlot).unregister());

    }

    setToggled(toggled) {
        this.resetState();
        super.setToggled(toggled);
    }

    resetState() {
        this.lastClick = Date.now();
        this.canClick = false;

        this.currentWindowId = isNaN(mc.field_71462_r?.field_147002_h?.field_75152_c) ? mc.field_71462_r?.field_147002_h?.field_75152_c : null;
        this.items = [];
        this.lastClickedSlotId = -1;
        this.lastClickedItemId = -1;
        this.lastSolutionLength = -1;
        this.stopInvwalk = false;

        this.melodyClicker = [];
        this.melodyUpdated = true;
        this.melodyClicking = false;

        this.windowOpend = Date.now();
    }

    resetLastClickedSlot() {
        this.lastClickedItemId = -1;
        this.lastClickedSlotId = -1;
        this.lastSolutionLength = -1;
    }

    onOpenWindowPacketReceived(packet, event) {
        const windowId = packet.func_148901_c();
        this.canClick = true;
        this.currentWindowId = windowId;
        this.items.length = 0;
        this.stopInvwalk = false;
        
        this.melodyClicker = [];
        this.melodyUpdated = true;
        this.melodyClicking = false;

        this.windowOpend = Date.now();
    }

    onSetSlotPacketReceived(packet, event) {
        const windowId = packet.func_149175_c();
        const slotId = packet.func_149173_d();
        const item = packet.func_149174_e();
        if (slotId === -1 && item === null && Date.now() - this.windowOpend >= Math.max(AutoTermsModule.fcDelay.getValue(), 350)) this.melodyClicking = false;
        if (this.currentWindowId === null) return;
        if (this.currentWindowId !== windowId) return;
        this.items[slotId] = item;
        if (slotId !== -1) this.melodyUpdated = true;
    }

    onGuiRender(x, y, gui) {
        if (!this.isToggled()) return;
        if (this.stopInvwalk || this.melodyClicking) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        const currentTerm = OdinTerminalSolver.INSTANCE.currentTerm;
        if (!currentTerm) return;
        const type = currentTerm.type.name();
        const currentScreen = mc.field_71462_r;
        if (AutoTermsModule.invwalk.getValue() && currentScreen && /*type !== "MELODY" && */type !== "NONE") {
            const f = KeyBindingUtils.gameSettings.field_74341_c * 0.6 + 0.2;
            const f1 = f * f * f * 8;
            const dx = Mouse.getDX() * f1;
            const dy = Mouse.getDY() * f1;

            Player.getPlayer().func_70082_c(dx, dy);
        }
    }

    onGuiClick(x, y, button, gui, event) {
        if (!this.isToggled()) return;
        if (this.clicking) return;
        if (!AutoTermsModule.cancelClicks.getValue()) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        const currentTerm = OdinTerminalSolver.INSTANCE.currentTerm;
        if (!currentTerm) return;
        const type = currentTerm.type.name();
        // const currentScreen = gui;
        const currentScreen= mc.field_71462_r;
        if (currentScreen &&/* type !== "MELODY" && */type !== "NONE") {
            cancel(event);
        }
    }

    onTick() {
        if (!this.isToggled()) return;
        if (!SkyblockUtils.isInSkyblock()) return;
        const currentTerm = OdinTerminalSolver.INSTANCE.currentTerm;
        if (!currentTerm) return;
        const type = currentTerm.type.name();
        const currentScreen = mc.field_71462_r;

        // invwalk
        if (AutoTermsModule.invwalk.getValue() && currentScreen instanceof GuiChest) {
            const Forward = KeyBindingUtils.gameSettings.field_74351_w.func_151463_i();
            const Left = KeyBindingUtils.gameSettings.field_74370_x.func_151463_i();
            const Back = KeyBindingUtils.gameSettings.field_74368_y.func_151463_i();
            const Right = KeyBindingUtils.gameSettings.field_74366_z.func_151463_i();
            const Jump = KeyBindingUtils.gameSettings.field_74314_A.func_151463_i();
            const Sneak = KeyBindingUtils.gameSettings.field_74311_E.func_151463_i();
            const Sprint = KeyBindingUtils.gameSettings.field_151444_V.func_151463_i();
            if (/*type !== "MELODY" && */type !== "NONE" && Player.getPlayer().field_71071_by.func_70445_o() === null && !this.stopInvwalk && !this.melodyClicking) {
                KeyBindingUtils.setKeyState(Forward, KeyBindingUtils.isKeyDown(Forward));
                KeyBindingUtils.setKeyState(Left, KeyBindingUtils.isKeyDown(Left));
                KeyBindingUtils.setKeyState(Back, KeyBindingUtils.isKeyDown(Back));
                KeyBindingUtils.setKeyState(Right, KeyBindingUtils.isKeyDown(Right));
                KeyBindingUtils.setKeyState(Jump, KeyBindingUtils.isKeyDown(Jump));
                KeyBindingUtils.setKeyState(Sneak, KeyBindingUtils.isKeyDown(Sneak));
                KeyBindingUtils.setKeyState(Sprint, KeyBindingUtils.isKeyDown(Sprint));
                // if (AutoTermsModule.cancelClicks.getValue()) {
                //     KeyBindingUtils.setLeftClick(Mouse.isButtonDown(0));
                //     KeyBindingUtils.setRightClick(Mouse.isButtonDown(1));
                // }
            } else {
                KeyBindingUtils.setKeyState(Forward, false);
                KeyBindingUtils.setKeyState(Left, false);
                KeyBindingUtils.setKeyState(Back, false);
                KeyBindingUtils.setKeyState(Right, false);
                KeyBindingUtils.setKeyState(Jump, false);
                KeyBindingUtils.setKeyState(Sneak, false);
                KeyBindingUtils.setKeyState(Sprint, false);
                // if (AutoTermsModule.cancelClicks.getValue()) {
                //     KeyBindingUtils.setLeftClick(false);
                //     KeyBindingUtils.setRightClick(false);
                // }
            }
        }

        if (type === "MELODY") {
            if (!currentScreen || !(currentScreen instanceof GuiContainer)) return;
            if (this.melodyClicker.length > 0) {
                this.melodyClicker.shift()(currentScreen);
                this.melodyClicking = true;
                unpress();
                return;
            }
            if (!this.melodyUpdated || Player.getPlayer().field_71071_by.func_70445_o() !== null) return;
            let current = -1;
            for (let i = 1; i < 6; i++) {
                let itemStack = currentScreen.field_147002_h.field_75151_b[i]?.func_75211_c();
                if (!itemStack) continue;
                if (itemStack.func_77973_b() !== MCItem.func_150898_a(Blocks.field_150397_co) || itemStack.func_77952_i() !== 2) continue;
                current = i;
                break;
            }
            if (current === -1) return;

            let progress = -1;
            for (let i = 1; i < 5; i++) {
                let itemStack = currentScreen.field_147002_h.field_75151_b[7 + 9 * i]?.func_75211_c();
                if (!itemStack) continue;
                if (itemStack.func_77973_b() !== MCItem.func_150898_a(Blocks.field_150406_ce) || itemStack.func_77952_i() !== 5) continue;
                progress = i;
            }
            if (progress === -1) return;

            const itemStack = currentScreen.field_147002_h.field_75151_b[current + progress * 9]?.func_75211_c();
            if (!itemStack) return;
            if (itemStack.func_77973_b() !== MCItem.func_150898_a(Blocks.field_150397_co) || itemStack.func_77952_i() !== 5) return;
            const clickIndex = 7 + progress * 9;
            const clickStack = currentScreen.field_147002_h.field_75151_b[clickIndex]?.func_75211_c();
            if (!clickStack) return;
            this.clickSlotButton(currentScreen, clickIndex, 2);
            if (current === 1 || current === 5) {
                if (progress < 2) this.melodyClicker.push((screen) => this.clickSlotButton(screen, 25, 2));
                if (progress < 3) this.melodyClicker.push((screen) => this.clickSlotButton(screen, 34, 2));
                if (progress < 4) this.melodyClicker.push((screen) => this.clickSlotButton(screen, 43, 2));
            }
            this.melodyClicking = true;
            this.melodyUpdated = false;
            unpress();
            return;
        }

        // autoterm
        if (Date.now() - currentTerm.timeOpened < AutoTermsModule.fcDelay.getValue()) return;
        if (!currentScreen || !(currentScreen instanceof GuiContainer)) return;
        if (!this.canClick && Date.now() - this.lastClick >= AutoTermsModule.retryDelay.getValue()) {
            this.canClick = true;
            this.resetLastClickedSlot();
            this.stopInvwalk = true;
            if (AutoTermsModule.invwalk.getValue()) unpress();
        }
        if (Date.now() - this.lastClick < AutoTermsModule.delay.getValue()) return;
        if (!this.canClick) return;
        if (type === "MELODY" || type === "NONE") return;
        const solution = currentTerm.solution;
        if (!solution) return;
        let length = solution.length;
        if (length < 1) return;
        // odin term solver updating is too slow
        let offset = this.lastSolutionLength !== -1 && length > 1 ? length - this.lastSolutionLength : -1;
        length -= offset + 1;
        let slotId = solution[offset + 1];
        if (isNaN(slotId)) return;
        let itemStack = currentScreen.field_147002_h.field_75151_b[slotId].func_75211_c();
        if (!itemStack) return;
        let itemId = itemStack.func_77960_j();
        // double check
        if (itemId !== this.items[slotId]?.func_77960_j()) return;
        // grabbed item
        if (Player.getPlayer().field_71071_by.func_70445_o() !== null) return;

        let button = 0;
        if (type === "RUBIX" && slotId === solution[offset + 3]) {
            button = 1;
            if (slotId === solution[offset + 4]) {
                length -= 3;
            } else {
                length += 2;
            }
        }

        const mode = AutoTermsModule.mode.getValue();
        if (button === 1 || mode === "LEFT") {
            this.clickSlotButton(currentScreen, slotId, button);
        } else if (mode === "MIDDLE") {
            this.clickSlotButton(currentScreen, slotId, 2);
        } else if (mode === "DROP") {
            this.dropSlot(currentScreen, slotId);
        }

        // this.clickSlotButton(currentScreen, slotId, button);
        // ChatLib.chat("click")
        this.canClick = false;
        this.lastClick = Date.now();
        // this.lastClickedSlotId = slotId;
        // this.lastClickedItemId = itemId;
        this.lastSolutionLength = length;
    }

    dropSlot(screen, slotIndex) {
        if (!(screen instanceof GuiContainer)) return;
        const slot = screen.field_147002_h.field_75151_b[slotIndex];
        if (!slot) return;
        theSlotField.set(screen, slot);
        const dropKeyCode = KeyBindingUtils.gameSettings.field_74316_C.func_151463_i();
        this.clicking = true;
        // press drop key
        keyTypedMethod.invoke(screen, new JavaChar(KeyBindingUtils.getKeyName(dropKeyCode)[0].toLowerCase()), new JavaInt(dropKeyCode));
        this.clicking = false;
    }
    
    clickSlotButton(screen, slotIndex, button) {
        if (!(screen instanceof GuiContainer)) return;
        const slot = screen.field_147002_h.field_75151_b[slotIndex];
        const x = slot.field_75223_e + 8 + guiLeftField.get(screen);
        const y = slot.field_75221_f + 8 + guiTopField.get(screen);
        this.clicking = true;
        const keyDownBuffer =  keyDownBufferField.get(null);
        const wasShiftDown = Keyboard.isKeyDown(42);
        keyDownBuffer.put(42, 0);
        mouseClickedMethod.invoke(screen, new JavaInt(x), new JavaInt(y), new JavaInt(button));
        mouseReleasedMethod.invoke(screen, new JavaInt(x), new JavaInt(y), new JavaInt(button));
        keyDownBuffer.put(42, wasShiftDown ? 1 : 0);
        this.clicking = false;
    }

    getSuffix() {
        const mode = AutoTermsModule.mode.getValue();
        return [mode.charAt(0) + mode.slice(1).toLowerCase()];
    }
}