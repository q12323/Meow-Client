import { McUtils } from "../../../../utils/McUtils";
import { RoomUtils } from "../../../../utils/RoomUtils";
import { BlockList } from "./BlockList";

export class RouteBlock {
    constructor(room, blockPos, blockState) {
        this.room = room;
        this.pos = blockPos;
        this.state = blockState;
        this.deleted = false;
        this.add();
        // ChatLib.chat(this.room)
    }

    add() {
        BlockList.add(this);
    }

    delete() {
        this.deleted = true;
        BlockList.delete(this);
    }

    setBlock(world) {
        if (this.deleted) return;
        const pos = RoomUtils.getRealBlockPos(this.pos);
        const state = this.state;
        McUtils.setBlock(world, pos, state);
    }

    getJsonObject() {
    }
}