import { RoomUtils } from "../../utils/RoomUtils";
import { Module } from "../Module";

export class ZFlipModule extends Module {
    constructor() {
        super("ZFlip", false, 0, false);
    }

    setToggled(toggled) {
        RoomUtils.zFlip = toggled;
        super.setToggled(toggled);
    }
}