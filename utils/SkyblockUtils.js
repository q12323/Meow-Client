export class SkyblockUtils {

    static forceSkyblock = false;

    static inSkyblock = false;

    static skyblockDetectionTrigger = register("Tick", () => {
        if (SkyblockUtils.forceSkyblock) {
            SkyblockUtils.inSkyblock = true;
            return;
        }
        if (!Scoreboard?.getScoreboard()) {
            SkyblockUtils.inSkyblock = false;
            return;
        }
        SkyblockUtils.inSkyblock = ChatLib.removeFormatting(Scoreboard.getTitle()).includes("SKYBLOCK");
    }).unregister();

    static isInSkyblock() {
        return SkyblockUtils.inSkyblock;
    }
}