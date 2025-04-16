import { ModuleManager } from "../module/ModuleManager";
import { CommandManager } from "../command/CommandManager";
import { SkyblockUtils } from "../utils/SkyblockUtils";
import { Scheduler } from "../utils/Scheduler";

CommandManager.commandTrigger.register();
CommandManager.inputTrigger.register();
ModuleManager.keyBindTrigger.register();
SkyblockUtils.skyblockDetectionTrigger.register();
Scheduler.register();