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
        try {
            SkyblockUtils.inSkyblock = ChatLib.removeFormatting(Scoreboard.getTitle()).includes("SKYBLOCK");
        } catch (error) {
            console.log(`error while checking skyblock: ${error}`);
            SkyblockUtils.inSkyblock = false;
        }
    }).unregister();

    static isInSkyblock() {
        return SkyblockUtils.inSkyblock;
    }
}