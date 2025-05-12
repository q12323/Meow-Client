import "./config/Config";
import "./module/modules/autoRoute/route/RoutesList";
import "./module/modules/autoRoute/AutoRouteConfig";
import "./module/ModuleManager";
import "./command/CommandManager";
import "./weapon/WeaponManager";
import "./trigger/Triggers";
import "./killaura"
import { APIUtils } from "./utils/APIUtils";

let authenticated = false

register("worldload", () => {
    if (authenticated) return;
    authenticated = true;
    APIUtils.auth();
})