import { KeyBindingUtils } from "../../../../../utils/KeyBindingUtils";
import { Scheduler } from "../../../../../utils/Scheduler";
import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";

export class JumpRoute extends Route {
    constructor(room, x, y, z, args) {
        super("jump", room, x, y, z, args, -1);
    }

    run() {
        this.args.startDelay();
        if (!this.args.canExecute()) return;
        
        const jumpkey = KeyBindingUtils.gameSettings.field_74314_A.func_151463_i();
        KeyBindingUtils.setKeyState(jumpkey, true);
        Scheduler.schedulePreTickTask(() => KeyBindingUtils.setKeyState(jumpkey, false), 1);

        this.activated = true;
        SecretThing.secretClicked = 0;
        this.args.clearDelayTimer();
    }
}