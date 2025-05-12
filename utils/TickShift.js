import { KeyBindingUtils } from "./KeyBindingUtils";
import { McUtils } from "./McUtils";

const mc = McUtils.mc;
const timerField = mc.getClass().getDeclaredField("field_71428_T");
timerField.setAccessible(true);

export const TickShift = new class {
    constructor() {

        this.shiftingTicks = 0;
        this.shiftedTicks = 0;
        this.releasingTicks = false;

        this.shiftingTps = 20;

        this.maxShiftedTicks = 10;

        this.mainTickShiftTrigger = register("RenderWorld", () => {
            new Thread(() => {
                mc.func_152344_a(() => {
                    try {
                        this.onPostTimerUpdate();
                    } catch (e) {
                        console.log(`${e}\n${e?.stack}`);
                    }
                })
            }).start();
        }).unregister();

        this.resetTrigger = register("WorldLoad", () => {
            this.shiftedTicks = 0;
        }).unregister();
    }

    setShiftingTps(tps) {
        this.shiftingTps = tps;
    }

    shift(tps) {
        this.shiftingTps = tps;
    }

    release() {
        this.releasingTicks = true;
    }

    onPostTimerUpdate() {
        const timer = timerField.get(mc);
        if (this.isMoving()) {
            this.release();
        }

        if (this.releasingTicks) {
            this.setShiftingTps(20);
            this.releasingTicks = false;
            timer.field_74280_b = Math.min(timer.field_74280_b + this.shiftedTicks, this.maxShiftedTicks);
            this.shiftedTicks = 0;
        } else {

            const elapsedTicks = timer.field_74280_b;
            for (let i = 0; i < elapsedTicks; i++) {
                if (this.shiftedTicks >= this.maxShiftedTicks) break;
    
                this.shiftingTicks += 1 - this.shiftingTps / 20;
                if (this.shiftingTicks >= 1) {
                    --timer.field_74280_b;
                    --this.shiftingTicks;
                    ++this.shiftedTicks;
                }
            }
        }
    }

    isMoving() {
        const Forward = KeyBindingUtils.gameSettings.field_74351_w;
        const Left = KeyBindingUtils.gameSettings.field_74370_x;
        const Back = KeyBindingUtils.gameSettings.field_74368_y;
        const Right = KeyBindingUtils.gameSettings.field_74366_z;

        return KeyBindingUtils.isKeyDown(Forward.func_151463_i()) ||
        KeyBindingUtils.isKeyDown(Back.func_151463_i()) ||
        KeyBindingUtils.isKeyDown(Right.func_151463_i()) ||
        KeyBindingUtils.isKeyDown(Left.func_151463_i());
    }

    register() {
        this.mainTickShiftTrigger.register();
        this.resetTrigger.register();
    }
}