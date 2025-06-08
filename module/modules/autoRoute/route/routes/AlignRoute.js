import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";

export class AlignRoute extends Route {
    constructor(room, x, y, z, args) {
        super("align", room, x, y, z, args, 10);
    }
    
    run() {
        this.args.startDelay();
        if (!this.args.canExecute()) return;

        const pos = this.getRealCoords();
        Player.getPlayer().func_70107_b(pos[0], Player.getY(), pos[2]);
        
        this.activated = true;
        SecretThing.secretClicked = 0;
        this.args.clearDelayTimer();
        return true;
    }
}
