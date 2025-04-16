import { RoomUtils } from "../../../../utils/RoomUtils";
import { AotvRoute } from "./routes/AotvRoute";
import { BatRoute } from "./routes/BatRoute";
import { BoomRoute } from "./routes/BoomRoute";
import { EtherwarpTargetRoute } from "./routes/EtherwarpTargetRoute";
import { PearlClipRoute } from "./routes/PearlClipRoute";
import { StopRoute } from "./routes/StopRoute";
import { UseItemRoute } from "./routes/UseItemRoute";
import { WalkRoute } from "./routes/WalkRoute";
import { Routes } from "./RoutesList";

export const RouteManager = new class {
    constructor() {
        // new EtherwarpTargetRoute("Unknown", 18, 101, -13, false, 18.5, 101, -9.5);
    }

    addFromJsonObject(json) {
        const data = json.data;
        switch(json.type) {
            case "etherwarp_target":
                new EtherwarpTargetRoute(json.room, json.x, json.y, json.z, json.await_secret, data.x, data.y, data.z);
                break;

            case "walk":
                new WalkRoute(json.room, json.x, json.y, json.z, json.await_secret, data.yaw, data?.pitch || 0);
                break;

            case "use_item":
                new UseItemRoute(json.room, json.x, json.y, json.z, json.await_secret, data.yaw, data.pitch, data.item_name);
                break;

            case "bat":
                new BatRoute(json.room, json.x, json.y, json.z, json.await_secret, data.yaw, data.pitch);
                break;

            case "pearl_clip":
                new PearlClipRoute(json.room, json.x, json.y, json.z, json.await_secret, data.distance);
                break;

            case "right_click":
                new UseItemRoute(json.room, json.x, json.y, json.z, json.await_secret, 0, -90, data.item_name);
                // new RightClickRoute(json.room, json.x, json.y, json.z, json.await_secret, data.item_name);
                break;

            case "boom":
                new BoomRoute(json.room, json.x, json.y, json.z, json.await_secret, data.yaw, data.pitch);
                break;

            case "stop":
                new StopRoute(json.room, json.x, json.y, json.z, json.await_secret);
                break;

            case "aotv":
                new AotvRoute(json.room, json.x, json.y, json.z, json.await_secret, data.yaw, data.pitch, data.x, data.y, data.z);
                break
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
