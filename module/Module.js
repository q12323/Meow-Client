import { Property } from "../property/Property";
import { KeyBindingUtils } from "../utils/KeyBindingUtils";

export class Module {

    name;
    toggled;
    defaultToggled;
    key;
    defaultKey;
    hidden;
    defaultHidden;

    playToggleSound = false;

    /**
     * 
     * @param {string} name 
     * @param {boolean} toggled 
     * @param {integer} key 
     * @param {boolean} hidden 
     */
    constructor(name, toggled, key, hidden) {
        
        this.isPressed = false;
        this.name = name;
        this.toggled = toggled;
        this.key = key;
        this.hidden = hidden;

        this.defaultToggled = toggled;
        this.defaultKey = key;
        this.defaultHidden = hidden;

        this.triggers = new Set();
    }

    toJsonObject() {
        const json = {};

        json.toggled = this.isToggled();
        json.key = this.getKey();
        json.hidden = this.isHidden();

        const properties = this.getProperties();

        for (let property of properties) {
            json[property.getName()] = property.getValue();
        }

        return json;
    }

    loadFromJsonObject(json) {
        let overrideConfig = false;
        try {
            this.setToggled(json.toggled);
            this.setKey(json.key);
            this.setHidden(json.hidden);
        } catch (error) {
            console.log(`error while loading module ${this.getName()} from config: ${error}`);
            this.setDefaultToggled();
            this.setDefaultKey();
            this.setDefaultHidden();
            overrideConfig = true;
        }

        const properties = this.getProperties();

        for (let property of properties) {
            try {
                let value = json[property.getName()];
                if (value === undefined) throw new Error(`property with name ${property.getName()} is undefined`);
                property.setValue(property.getProperValue(value));
            } catch (error) {
                console.log(`error while loading property ${this.getName()}.${property.getName()} from config: ${error}`);
                property.setDefaultValue();
                overrideConfig = true;
            }
        }
        
        return overrideConfig;
    }

    getFormattedName() {
        return ((this.getKey() == 0 ? "" : "&l[" + KeyBindingUtils.getKeyName(this.getKey()) + "] &r") + this.getName() + " (" + (this.isToggled() ? "&a&lON" : "&c&lOFF") + "&r)");
    }

    getName() {
        return this.name;
    }

    /**
     * 
     * @returns [suffix1, suffix2, ...]
     */
    getSuffix() {
        return new Array();
    }

    isToggled() {
        return this.toggled;
    }

    toggle() {
        this.setToggled(!this.isToggled());
        if (!this.isHidden()) {
            this.playToggleSound = true;
            // TODO: i dont like this
            // ChatUtils.chat(`${ChatUtils.PREFIX}${this.getName()}: ${(this.isToggled() ? "&a&lON" : "&c&lOFF")}&r`);
        }
    }

    setToggled(toggled) {
        this.toggled = toggled;

        if (this.isToggled()) {
            this.register();
        } else {
            this.unregister();
        }
    }

    register() {
        for (let trriger of this.triggers) {
            trriger.register();
        }
    }

    unregister() {
        for (let trigger of this.triggers) {
            trigger.unregister();
        }
    }

    getKey() {
        return this.key;
    }

    setKey(key) {
        // TODO: int check idk
        this.key = key;
    }

    isHidden() {
        return this.hidden;
    }

    setHidden(hidden) {
        this.hidden = hidden;
    }

    getProperties() {
        const fields = Object.values(this.constructor);
        const properties = [];

        for (let field of fields) {
            if (field instanceof Property) {
                properties.push(field);
            }
        }

        return properties;
    }

    setDefaultToggled() {
        this.setToggled(this.defaultToggled);
    }

    setDefaultKey() {
        this.setKey(this.defaultKey);
    }

    setDefaultHidden() {
        this.setHidden(this.defaultHidden);
    }
}
