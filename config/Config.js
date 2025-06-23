import { ModuleManager } from "../module/ModuleManager";
import { Scheduler } from "../utils/Scheduler";

const JavaFile = Java.type("java.io.File");

export const ConfigClass = new class {

	path = "./config/Meow/";
	default = "default";

	constructor() {
		try {
			if (this.doesExist(this.default)) {
				try {
					this.load(this.default);
				} catch (error) {
					this.save(this.default);
				}
			} else {
				this.save(this.default);
			}
		} catch (error) {
			console.log("error while loading default config: " + error);
		}
	}

	/**
	 * config load function
	 * @param {string} name config file to load without ".json"
	 */
	load(name) {

		if (!this.doesExist(name)) {
			throw new Error("File does not Exist!");
		}

		ModuleManager.unregisterAllModule();

		let overrideConfig = false;
		const configObject = JSON.parse(FileLib.read(`${this.path}${name}.json`));

		const modules = ModuleManager.getModulesArray()

		for (let module of modules) {
			try {
				let moduleConfig = configObject[module.getName()];
				if (!moduleConfig) {
					module.setDefaultToggled();
					module.setDefaultKey();
					module.setDefaultHidden();
					module.getProperties().forEach(property => property.setDefaultValue());
					overrideConfig = true;
					continue;
				}

				if (module.loadFromJsonObject(moduleConfig)) {
					overrideConfig = true;
				}
			} catch (error) {
				console.log(`error while loading module ${module.getName()} from config: ${error}\n${error?.getStackTrace() || error.stack}`);
				overrideConfig = true;
			}
		}

		if (overrideConfig) {
			this.save(name);
		}

	}

	/**
	 * config save function
	 * @param {string} name config file to save without ".json"
	 */
	save(name) {
		new JavaFile(Client.getMinecraft().field_71412_D, this.path.substring(1)).mkdirs();

		const configObject = {};

		const modules = ModuleManager.getModulesArray()

		for (let module of modules) {
			configObject[module.getName()] = module.toJsonObject();
		}

		FileLib.write(`${this.path}${name}.json`, JSON.stringify(configObject, null, 2));
	}

	doesExist(name) {
		return FileLib.exists(`${this.path}${name}.json`);
	}
}
