import { SecretThing } from "../../SecretThing";
import { Route } from "../Route";

const ClientCommandHandler = Java.type("net.minecraftforge.client.ClientCommandHandler");

export class CommandRoute extends Route {
    constructor(room, x, y, z, args, command) {
        super("command", room, x, y, z, args, -10);
        this.command = command;
        if (!this.command || typeof this.command !== "string") {
            this.delete();
            throw new Error("value is not valid");
        }
    }

    getJsonObject(json) {
        const obj = super.getJsonObject(json);
        obj.data.command = this.command;
        return obj;
    }

    run() {
        this.args.startDelay();
        if (!this.args.canExecute()) return;

        let runServerCommand = true;
        if (this.command.startsWith("/")) {
            const result = ClientCommandHandler.instance.func_71556_a(Player.getPlayer(), this.command);
            runServerCommand = result === 0 ? true : false;
        }

        if (runServerCommand) {
            ChatLib.say(this.command);
        }

        this.activated = true;
        SecretThing.secretClicked = 0;
        this.args.clearDelayTimer();
        return true;
    }
}