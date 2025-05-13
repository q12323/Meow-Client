import { Property } from "../Property";

const Color = Java.type("java.awt.Color");

export class PropertyRgb extends Property {

    r;
    g;
    b;
    color;

    /**
     * 
     * @param {string} name 
     * @param {string} defaultValue hex color
     */
    constructor(name, defaultValue) {
        super(name, "RGB", defaultValue);
        this.setDefaultValue();

    }

    getProperValue(value) {
        return String(value).toUpperCase();
    }

    getColor() {
        return this.color;
    }

    getTypeInfo() {
        return "color";
    }

    getFormattedValue() {
        return "&c" + this.r + "&a" + this.g + "&9" + this.b + "&r";
    }

    setValue(value) {
        value = String(value);
        if (!this.isValid(value)) {
            throw new Error("Value is not valid!")
        }
        
        const hex = [];
        // for (let i = 0; i < 6; i++) {
        //     hex[i] = (!parseInt(value[i], 16) ? "0" : String(value[i]));
        // }
        hex[0] = !parseInt(value[0], 16) ? "0" : String(value[0]);
        hex[1] = !parseInt(value[1], 16) ? "0" : String(value[1]);
        hex[2] = !parseInt(value[2], 16) ? "0" : String(value[2]);
        hex[3] = !parseInt(value[3], 16) ? "0" : String(value[3]);
        hex[4] = !parseInt(value[4], 16) ? "0" : String(value[4]);
        hex[5] = !parseInt(value[5], 16) ? "0" : String(value[5]);

        this.r = hex[0] + hex[1];
        this.g = hex[2] + hex[3];
        this.b = hex[4] + hex[5];

        this.color = new Color(parseInt(this.r, 16) / 255, parseInt(this.g, 16) / 255, parseInt(this.b, 16) / 255, 1);
        super.setValue(this.r + this.g + this.b);
    }

    isValid(value) {
        try {
            if (value.length > 6) return false;
            return true;
        } catch (error) {
            console.log(`error while checking PropertyRgb '${this.getName()}': ${error}`)
            return false;
        }
    }


}
