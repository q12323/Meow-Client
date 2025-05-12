import { RoomUtils } from "../../../../utils/RoomUtils";
import { AlignRoute } from "./routes/AlignRoute";
import { AotvRoute } from "./routes/AotvRoute";
import { BatRoute } from "./routes/BatRoute";
import { ClipRoute } from "./routes/ClipRoute";
import { BoomRoute } from "./routes/BoomRoute";
import { CommandRoute } from "./routes/CommandRoute";
import { EtherwarpRoute } from "./routes/EtherwarpRoute";
import { EtherwarpTargetRoute } from "./routes/EtherwarpTargetRoute";
import { JumpRoute } from "./routes/JumpRoute";
import { LookRoute } from "./routes/LookRoute";
import { PearlClipRoute } from "./routes/PearlClipRoute";
import { StopRoute } from "./routes/StopRoute";
import { UseItemRoute } from "./routes/UseItemRoute";
import { WalkRoute } from "./routes/WalkRoute";
import { Routes } from "./RoutesList";
import { HypeRoute } from "./routes/HypeRoute";

export const RouteManager = new class {
    constructor() {
        // new EtherwarpTargetRoute("Unknown", 18, 101, -13, false, 18.5, 101, -9.5);
    }

    addFromJsonObject(json) {
        const data = json.data;
        const args = json.args || { await_secret: json.await_secret, odin_transform: data.odin_transform};
        let addedRoute = null;
        switch(json.type) {
            case "etherwarp_target":
                addedRoute = new EtherwarpTargetRoute(json.room, json.x, json.y, json.z, args, data.x, data.y, data.z);
                break;

            case "walk":
                addedRoute = new WalkRoute(json.room, json.x, json.y, json.z, args, data.yaw, data?.pitch || 0);
                break;

            case "use_item":
                addedRoute = new UseItemRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch, data.item_name);
                break;

            case "bat":
                addedRoute = new BatRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch, data.x, data.y, data.z);
                break;

            case "pearl_clip":
                addedRoute = new PearlClipRoute(json.room, json.x, json.y, json.z, args, data.distance);
                break;

            case "right_click":
                addedRoute = new UseItemRoute(json.room, json.x, json.y, json.z, args, 0, -90, data.item_name);
                // new RightClickRoute(json.room, json.x, json.y, json.z, json.await_secret, data.item_name);
                break;

            case "boom":
                addedRoute = new BoomRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch);
                break;

            case "stop":
                addedRoute = new StopRoute(json.room, json.x, json.y, json.z, args);
                break;

            case "aotv":
                addedRoute = new AotvRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch, data.x, data.y, data.z);
                break

            case "hype":
                addedRoute = new HypeRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch, data.x, data.y, data.z);
                break;

            case "etherwarp":
                addedRoute = new EtherwarpRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch);
                break;

            case "look":
                addedRoute = new LookRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch);
                break;

            case "align":
                addedRoute = new AlignRoute(json.room, json.x, json.y, json.z, args);
                break;

            case "command":
                addedRoute = new CommandRoute(json.room, json.x, json.y, json.z, args, data.command);
                break;

            case "jump":
                addedRoute = new JumpRoute(json.room, json.x, json.y, json.z, args);
                break;

            case "clip":
                addedRoute = new ClipRoute(json.room, json.x, json.y, json.z, args, data.yaw, data.pitch, data.distance);
                break;
            
            default:
                console.log(`Unknown route type: ${json.type}`);
        }
        
    }

    removeClosestRoute(range) {
        const routes = Routes.getRoom(RoomUtils.getCurrentRoomName());
        let targetRoute = null;
        let distance = range;
        for (let route of routes) {
            if (route.deleted) continue;
            let dist = route.getDistance();
            if (dist <= distance) {
                targetRoute = route;
                distance = dist;
            }
        }
        if (targetRoute) {
            targetRoute.delete();
            return targetRoute;
        } else {
            return null;
        }
    }

    clearRoutes() {
        const routes = Routes.getRoom(RoomUtils.getCurrentRoomName());
        let i = 0;
        for (let route of routes) {
            if (route.deleted) continue;
            route.delete();
            i++;
        }
        return i;
    }
}
