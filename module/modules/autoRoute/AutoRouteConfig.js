import { Blocks } from "../../../../BloomCore/utils/Utils";
import { McUtils } from "../../../utils/McUtils";
import { BlockList } from "./block/BlockList";
import { RouteBlock } from "./block/RouteBlock";
import { RouteManager } from "./route/RouteManager";
import { Routes } from "./route/RoutesList";

const JavaFile = Java.type("java.io.File");
const MCBlock = Java.type("net.minecraft.block.Block");
const mc = McUtils.mc;
const mcDataDir = mc.field_71412_D;

const path = "./config/Meow/AutoRoutes/";
const defaultName = "default";

export const AutoRouteConfig = new class {
    constructor() {
        try {
            if (this.doesExist(defaultName)) {
                try {
                    this.load(defaultName);
                } catch (error) {
                    console.log("error while loading autoroute default " + error);
                    this.save(defaultName);
                }
            } else {
                this.save(defaultName);
            }
        } catch (error) {
            console.log("error while saving routes: " + error);
        }
        
    }

    /**
     * throws error when failed to load config
     * @param {*} name 
     */
    load(name) {
        if (!this.doesExist(name)) {
            throw new Error(`the name ${name}.json does not exist in AutoRoutes`);
        }

        let overrideConfig = false;
        const configObject = JSON.parse(FileLib.read(`${path}${name}.json`));//{Routes: []} // load from file
        const routesArray = configObject.Routes;
        // console.log(routesArray[0].value.x)
        Routes.clear();
        for (let route of routesArray) {
            try {
                RouteManager.addFromJsonObject(route);
            } catch (error) {
                overrideConfig = true;
                console.log(`error while loading autoroute ${name} ${error} \n${error?.stack}`);
            }
        }

        BlockList.clearRooms();

        try {
            for (let room of configObject.Rooms) {
                for (let block of room.blocks) {
                    if (!Array.isArray(block)) block = block.split(",")
                    new RouteBlock(room.name, new BlockPos(Number(block[0]), Number(block[1]), Number(block[2])).toMCBlock(), MCBlock.func_176220_d(block[3]));
                }
            }
        } catch (error) {
            overrideConfig = true;
            console.log(`error while loading autoroute blocks ${error}`)
        }

        if (overrideConfig) {
            this.save(name);
        }
    }

    save(name) {
		new JavaFile(mcDataDir, path.substring(1)).mkdirs();

        const routes = Routes.get();
        const roomNames = Object.getOwnPropertyNames(routes);
        const routesArray = [];
        for (let roomName of roomNames) {
            let room = routes[roomName];
            for (let route of room) {
                routesArray.push(route.getJsonObject());
                // console.log(JSON.stringify(route.getJsonObject()));
            }
        }

        const roomsArray = [];
        
        const roomsBlock = BlockList.getRooms();

        const roomNamesBlock = Object.getOwnPropertyNames(roomsBlock);
        // ChatLib.chat(roomNamesBlock.toString())

        for (let roomName of roomNamesBlock) {
            let roomObj = {
                name: roomName,
                blocks: []
            };
            let blocks = roomsBlock[roomName];
            for (let block of blocks) {
                if (block.deleted) continue;
                let pos = block.pos;
                roomObj.blocks.push([
                    pos.func_177958_n(),
                    pos.func_177956_o(),
                    pos.func_177952_p(),
                    MCBlock.func_176210_f(block.state)
                ].join(","));
            }
            roomsArray.push(roomObj);
        }

        // config = {
        //     Rooms: [
        //         {
        //             name: "Unknown",
        //             blocks: [
        //                 "x,y,z,id",
        //                 "0,0,0,0",
        //                 "1,2,3,0",
        //                 "4,5,10,1"
        //             ]
        //         }
        //     ],
        //     Routes: [
        //         {
                    
        //         }
        //     ]
        // }

        FileLib.write(`${path}${name}.json`, JSON.stringify({
            Routes: routesArray,
            Rooms: roomsArray
        }, null, 2));
    }

    doesExist(name) {
		return FileLib.exists(`${path}${name}.json`);
    }
}
