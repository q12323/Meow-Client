import { ChatUtils } from "../utils/ChatUtils";
import { KeyBindingUtils } from "../utils/KeyBindingUtils";
import { ModuleList } from "./ModuleList";
import { AimAssistModule } from "./modules/AimAssistModule";
import { AutoClickerModule } from "./modules/AutoClickerModule";
import { AutoRouteModule } from "./modules/AutoRouteModule";
import { AutoTermsModule } from "./modules/AutoTermsModule";
import { AutoWishModule } from "./modules/AutoWishModule";
import { BarClipModule } from "./modules/BarClipModule";
import { CrystalAuraModule } from "./modules/CrystalAuraModule";
import { ESPModule } from "./modules/ESPModule";
import { FastPlaceModule } from "./modules/FastPlaceModule";
import { GayModule } from "./modules/GayModule";
import { HUDModule } from "./modules/HUDModule";
import { IceFillModule } from "./modules/IceFillModule";
import { KeepSprintModule } from "./modules/KeepSprintModule";
import { NoHitDelayModule } from "./modules/NoHitDelayModule";
import { RelicAuraModule } from "./modules/RelicAuraModule";
import { RightClickerModule } from "./modules/RightClickerModule";
import { SpeedModule } from "./modules/SpeedModule";
import { SprintModule } from "./modules/SprintModule";
// import { TNTAuraModule } from "./modules/TNTAuraModule";
// import { NPModule } from "./modules/NPModule";
// import { TestModule } from "./modules/TestModule";
import { RareDropModule } from "./modules/RareDropModule"
import { VelocityModule } from "./modules/VelocityModule";
import { XFlipModule } from "./modules/XFlipModule";
import { ZFlipModule } from "./modules/ZFlipModule";
import { TriggerBotModule } from "./modules/TriggerBotModule";
import { WaterBoardModule } from "./modules/WaterBoardModule";

export const ModuleManager = new class {
	
	constructor () {

		this.playToggleSound = false;
		// this.modules = new Set();

		// this.modules.add(new TestModule());
		// this.modules.add(new NPModule());

		this.add(new AimAssistModule());
		this.add(new AutoClickerModule());
		this.add(new AutoRouteModule());
		this.add(new AutoTermsModule());
		this.add(new AutoWishModule());
		this.add(new BarClipModule());
		this.add(new CrystalAuraModule());
		this.add(new ESPModule());
		this.add(new FastPlaceModule());
		this.add(new GayModule());
		this.add(new HUDModule());
		this.add(new IceFillModule());
		this.add(new KeepSprintModule());
		this.add(new NoHitDelayModule());
		this.add(new RareDropModule());
		this.add(new RelicAuraModule());
		this.add(new RightClickerModule());
		this.add(new SpeedModule());
		this.add(new SprintModule());
		// this.add(new TNTAuraModule());
		this.add(new TriggerBotModule());
		this.add(new VelocityModule());
		this.add(new WaterBoardModule());
		this.add(new XFlipModule());
		this.add(new ZFlipModule());

		this.keyBindTrigger = register("Tick", () => {
			this.onTick();
		}).unregister();

	}

	add(module) {
		ModuleList.add(module);
	}

	getModules() {
		return ModuleList.getModules();
	}

	getModulesArray() {
		return Object.values(ModuleList.modules);
	}

	onTick() {

		let playToggleSound = false;
		for (let module of this.getModulesArray()) {

			let key = module.getKey()
			// if (mc.currentScreen === null)
			if (Client.getMinecraft().field_71462_r === null && key !== 0) {

				
				if (KeyBindingUtils.isKeyDown(key) && !module.isPressed) {
					module.toggle();
					if (HUDModule.toggleAlerts.getValue() && !module.isHidden()) {
					    ChatUtils.chat(`${ChatUtils.PREFIX}${module.getName()}: ${(module.isToggled() ? "&a&lON" : "&c&lOFF")}&r`);
					}
					if (!HUDModule.toggleSounds.getValue()) {
						module.playToggleSound = false;
					}
					module.isPressed = true;
				} else if (!KeyBindingUtils.isKeyDown(key)) {
					module.isPressed = false;
				}

			}

			if (module.playToggleSound) {
				playToggleSound = true;
				module.playToggleSound = false;
			}

		}

		if (playToggleSound) {
			playToggleSound = false;
			World.playSound("gui.button.press", 0.25, 1);
		}
		
		
	}

	unregisterAllModule() {
		for (let module of this.getModulesArray()) {
			module.unregister();
		}
	}

	/**
	 * get module instance from module name
	 * @param {string} moduleName 
	 * @returns module instance or null
	 */
	getModule(moduleName) {
		return ModuleList.get(moduleName);
	}

	/**
	 * 
	 * @returns module names array
	 */
	getNames() {

		return this.getModulesArray().map(module => module.getName());
	}

}
