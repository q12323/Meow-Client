export class BlockList {
    static rooms = {};

    static getRooms() {
        return this.rooms;
    }

    static get(roomName) {
        // ChatLib.chat(roomName)
        if (!this.getRooms()[roomName]) this.clear(roomName);
        // ChatLib.chat(Object.getOwnPropertyNames(this.getRooms()).toString())
        return this.getRooms()[roomName];
    }

    static clear(roomName) {
        this.getRooms()[roomName] = new Set();
    }

    static clearRooms() {
        this.rooms = {};
    }

    static add(block) {
        const roomName = block.room;
        // ChatLib.chat(roomName)
        if (!this.get(roomName)) this.clear(roomName);
        const prevBlock = this.getBlockAt(roomName, block.pos);
        if (prevBlock !== null) prevBlock.delete();
        this.get(roomName).add(block);
    }

    static delete(block) {
        const blocks = this.get(block.room);
        const result = blocks ? blocks.delete(block) : false;
        // ChatLib.chat(result);
        return result;
        // return blocks ? blocks.delete(block) : false;
        // return blocks.delete(block);
    }

    static has(block) {
        const blocks = this.get(block.room);
        return blocks ? blocks.has(block) : false;
    }

    static getBlockAt(roomName, blockPos) {
        // ChatLib.chat(roomName)
        const blocks = this.get(roomName);
        for (let block of blocks) {
            if (block.deleted) continue;
            if (blockPos.equals(block.pos)) return block;
        }
        return null;
    }
}