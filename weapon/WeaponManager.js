import { ItemUtils } from "../utils/ItemUtils";

const JavaFile = Java.type("java.io.File");

export const WeaponManager = new class {

    path = "./config/Meow/";
    name = "weapons";

    constructor() {
        this.weapons = new Set();
        this.weaponsUUID = new Set();

        try {
            if (this.doesExist()) {
                try {
                    this.load();
                } catch(error) {
                    console.log(error);
                    this.save();
                }
            } else {
                this.save();
            }
        } catch (error) {
            console.log("error while loading weapons: " + error);
        }
    }

    isWeapon(item) {
        if (item !== null && this.weapons.has(String(item.getID()))) return true;
        return false;

    }

    isUUIDWeapon(item) {
        const uuid = ItemUtils.getItemUUID(item);
        if (uuid !== null && this.weaponsUUID.has(uuid)) return true;
        else false;
    }

    add(item) {
        try {
            this.weapons.add(String(item.getID()));
            this.save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }

    }

    remove(item) {
        try {
            this.weapons.delete(String(item.getID()));
            this.save();
            return true;
            
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    addUUID(item) {
        try {
            const uuid = ItemUtils.getItemUUID(item);
            if (uuid === null) return false;
            this.weaponsUUID.add(String(uuid));
            this.save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    removeUUID(item) {
        try {
            const uuid = ItemUtils.getItemUUID(item);
            if (uuid === null) return false;
            this.weaponsUUID.delete(uuid);
            this.save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    clear() {
        try {
            this.weapons = new Set();
            this.save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    clearUUID() {
        try {
            this.weaponswUUID = new Set();
            this.save();
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    save() {
        new JavaFile(Client.getMinecraft().field_71412_D, this.path.substring(1)).mkdirs();
        FileLib.write(`${this.path}${this.name}.txt`, [...this.weapons].join("\r\n"));
        FileLib.write(`${this.path}${this.name}UUID.txt`, [...this.weaponsUUID].join("\r\n"));
    }

    load() {
        if (!this.doesExist()) {
			throw new Error("File doesn't exist!");
		}

        this.weapons = new Set(FileLib.read(`${this.path}${this.name}.txt`).split("\r\n"));
        this.weaponsUUID = new Set(FileLib.read(`${this.path}${this.name}UUID.txt`).split("\r\n"));
    }

    doesExist() {
		return FileLib.exists(`${this.path}${this.name}.txt`);
	}
 }
