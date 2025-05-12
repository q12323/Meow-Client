// by Serenity & gekke

const OdinDungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils");
const MathHelper = Java.type("net.minecraft.util.MathHelper");

export class RoomUtils {

    static xFlip = false;

    static zFlip = false;

    static getRotation() {
        const currentRoom = RoomUtils.getCurrentRoom();
        if (!currentRoom) return "NORTH";

        let rotation = String(currentRoom.rotation);

        switch (rotation) {
            case "NORTH":
                if (RoomUtils.zFlip) return "SOUTH";
                return "NORTH";

            case "WEST":
                if (RoomUtils.xFlip) return "EAST";
                return "WEST";

            case "SOUTH":
                if (RoomUtils.zFlip) return "NORTH";
                return "SOUTH";

            case "EAST":
                if (RoomUtils.xFlip) return "WEST";
                return "EAST";

            default:
                return "NORTH";
        }
    }

    static getCurrentRoom() {
        return OdinDungeonUtils.INSTANCE.currentRoom;
    }

    static getCurrentRoomName() {
        return OdinDungeonUtils.INSTANCE.currentRoomName;
    }

    static getRelativeCoords(x, y, z) {
        const currentRoom = RoomUtils.getCurrentRoom();
        if (!currentRoom) return [x, y, z];

        const center = RoomUtils.getCenter();

        x -= center[0];
        z -= center[1];

        const rotation = RoomUtils.getRotation();

        switch (rotation) {
            case "NORTH":
                return [x, y ,z];

            case "WEST":
                return [-z, y, x];

            case "SOUTH":
                return [-x, y, -z];

            case "EAST":
                return [z, y, -x];

            default:
                console.log(rotation);
                return [x, y, z];
        }
    }

    static getRealCoords(x, y, z) {
        const currentRoom = RoomUtils.getCurrentRoom();
        if (!currentRoom) return [x, y, z];

        const rotation = RoomUtils.getRotation();

        switch (rotation) {
            case "NORTH":
                break;

            case "WEST":
                [x, z] = [z, -x];
                break;

            case "SOUTH":
                [x, z] = [-x, -z];
                break;

            case "EAST":
                [x, z] = [-z, x];
                break;

            default:
                console.log(rotation);
        }

        const center = RoomUtils.getCenter();

        return [x + center[0], y, z + center[1]];
    }

    static getRealBlockPos(blockPos) {
        const currentRoom = this.getCurrentRoom();
        if (!currentRoom) return blockPos;
        return OdinDungeonUtils.INSTANCE.getRealCoords(currentRoom, blockPos);
    }

    static getRelativeBlockPos(blockPos) {
        const currentRoom = this.getCurrentRoom();
        if (!currentRoom) return blockPos;
        return OdinDungeonUtils.INSTANCE.getRelativeCoords(currentRoom, blockPos);
    }

    static getCenter() {
        const currentRoom = RoomUtils.getCurrentRoom();
        if (!currentRoom) return null;
        let minX = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let minZ = Number.MAX_SAFE_INTEGER;
        let maxZ = Number.MIN_SAFE_INTEGER;
        for (let roomComponent of currentRoom.roomComponents) {
            let x = roomComponent.x + 0.5;
            let z = roomComponent.z + 0.5;
            minX = x < minX ? x : minX;
            maxX = x > maxX ? x : maxX;
            minZ = z < minZ ? z : minZ;
            maxZ = z > maxZ ? z : maxZ;
        }

        return [(minX + maxX) * 0.5, (minZ + maxZ) * 0.5];
    }

    static getRealYaw(yaw) {
        const currentRoom = RoomUtils.getCurrentRoom();
        if (!currentRoom) return yaw;
        const rotation = RoomUtils.getRotation();
        yaw = Number(yaw);
        switch (rotation) {
            case "NORTH":
                break;

            case "WEST":
                yaw -= 90;
                break;

            case "SOUTH":
                yaw -= 180;
                break;

            case "EAST":
                yaw -= 270;
                break;
        }

        return MathHelper.func_76138_g(yaw);
    }

    static getRelativeYaw(yaw) {
        const currentRoom = RoomUtils.getCurrentRoom();
        if (!currentRoom) return yaw;
        const rotation = RoomUtils.getRotation();
        yaw = Number(yaw);
        switch (rotation) {
            case "NORTH":
                break;

            case "WEST":
                yaw += 90;
                break;

            case "SOUTH":
                yaw += 180;
                break;

            case "EAST":
                yaw += 270;
                break;
        }

        return MathHelper.func_76138_g(yaw);
    }
}