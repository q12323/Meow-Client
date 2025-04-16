import { KeyBindingUtils } from "../../../../../utils/KeyBindingUtils";
import { Route } from "../Route";

export class StopRoute extends Route {
    constructor(room, x, y, z, awaitSecret) {
        super("stop", room, x, y, z, awaitSecret, 10);

    }

    run() {
        const sneakKey = KeyBindingUtils.gameSettings.field_74311_E.func_151463_i();
        const Forward = KeyBindingUtils.gameSettings.field_74351_w.func_151463_i();
        const Left = KeyBindingUtils.gameSettings.field_74370_x.func_151463_i();
        const Back = KeyBindingUtils.gameSettings.field_74368_y.func_151463_i();
        const Right = KeyBindingUtils.gameSettings.field_74366_z.func_151463_i();

        // KeyBindingUtils.setKeyState(sneakKey, false);
        KeyBindingUtils.setKeyState(Forward, false);
        KeyBindingUtils.setKeyState(Left, false);
        KeyBindingUtils.setKeyState(Back, false);
        KeyBindingUtils.setKeyState(Right, false);

        this.activated = true;
    }
}