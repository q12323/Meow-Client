import { Scheduler } from "../../../../utils/Scheduler";

const RenderPlayerEventPre = Java.type("net.minecraftforge.client.event.RenderPlayerEvent$Pre");
const RenderPlayerEventPost = Java.type("net.minecraftforge.client.event.RenderPlayerEvent$Post");

export class SilentRotationHandler {

    static blockSilentRotation = false;

    static realRotations = {
        yaw: null,
        pitch: null,
        prevYaw: null,
        prevPitch: null
    };
    
    /**
     * sets further rotations on this tick to silent
     */
    static doSilentRotation() {
        if (SilentRotationHandler.blockSilentRotation) return false;
        const thePlayer = Player.getPlayer();
        if (thePlayer === null) return false;
        if (Object.values(SilentRotationHandler.realRotations).every((v) => v !== null)) return false;
        
        SilentRotationHandler.realRotations.yaw = thePlayer.field_70177_z;
        SilentRotationHandler.realRotations.pitch = thePlayer.field_70125_A;
        SilentRotationHandler.realRotations.prevYaw = thePlayer.field_70126_B;
        SilentRotationHandler.realRotations.prevPitch = thePlayer.field_70127_C;

        Scheduler.scheduleHighPostTickTask(() => {
            SilentRotationHandler.registerRender();

            thePlayer.field_70177_z = SilentRotationHandler.realRotations.yaw;
            thePlayer.field_70125_A = SilentRotationHandler.realRotations.pitch;
            thePlayer.field_70126_B = SilentRotationHandler.realRotations.prevYaw;
            thePlayer.field_70127_C = SilentRotationHandler.realRotations.prevPitch;

            SilentRotationHandler.realRotations.yaw = null;
            SilentRotationHandler.realRotations.pitch = null;
            SilentRotationHandler.realRotations.prevYaw = null;
            SilentRotationHandler.realRotations.prevPitch = null;

            Scheduler.scheduleHighPreTickTask(() => {
                SilentRotationHandler.unregisterRender();
            });
        });

        return true;
    }

    static renderPitch = {
        now: 0,
        prev: 0,
        realNow: 0,
        realPrev: 0
    };

    static registerRender() {
        const thePlayer = Player.getPlayer();
        if (thePlayer === null) return;
        SilentRotationHandler.renderPitch.now = thePlayer.field_70125_A;
        SilentRotationHandler.renderPitch.prev = thePlayer.field_70127_C;

        thePlayer.field_70761_aq = thePlayer.field_70177_z; // renderyawoffset = rotationyaw
        thePlayer.field_70759_as = thePlayer.field_70177_z; // rotationyawhead = rotationyaw

        SilentRotationHandler.pitchRenderer0.register();
        SilentRotationHandler.pitchRenderer1.register();
    }

    static unregisterRender() {
        SilentRotationHandler.pitchRenderer0.unregister();
        SilentRotationHandler.pitchRenderer1.unregister();
    }

    static pitchRenderer0 = register(RenderPlayerEventPre, (event) => {
        const thePlayer = event.entity;
        if (thePlayer !== Player.getPlayer()) return;
        SilentRotationHandler.renderPitch.realNow = thePlayer.field_70125_A;
        SilentRotationHandler.renderPitch.realPrev = thePlayer.field_70127_C;
        thePlayer.field_70125_A = SilentRotationHandler.renderPitch.now;
        thePlayer.field_70127_C = SilentRotationHandler.renderPitch.prev;
    }).unregister();

    static pitchRenderer1 = register(RenderPlayerEventPost, (event) => {
        const thePlayer = event.entity;
        if (thePlayer !== Player.getPlayer()) return;
        thePlayer.field_70125_A = SilentRotationHandler.renderPitch.realNow;
        thePlayer.field_70127_C = SilentRotationHandler.renderPitch.realPrev;
    }).unregister();
}