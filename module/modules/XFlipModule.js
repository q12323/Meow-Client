import { RoomUtils } from "../../utils/RoomUtils";
import { Module } from "../Module";

export class XFlipModule extends Module {
    constructor() {
        super("XFlip", false, 0, false);
    }

    setToggled(toggled) {
        // RoomUtils.xFlip = toggled;
        super.setToggled(toggled);
    }
}