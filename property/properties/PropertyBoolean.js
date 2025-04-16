
import { Property } from "../Property";

export class PropertyBoolean extends Property {

	/**
	 * 
	 * @param {string} name 
	 * @param {boolean} defaultValue 
	 */
	constructor(name, defaultValue) {

		super(name, "BOOLEAN", defaultValue);
	}

	getProperValue(value) {
		return String(value).toLowerCase() === "true" ? true : false;
	}

	getTypeInfo() {
		return "true/false";
	}

	getFormattedValue() {
        return ("&e" + (super.getValue() ? "&atrue" : "&cfalse") + "&r");
		// ------^
		// TODO: idk why i added this
    }

	
	setValue(value) {
		if (this.isValid(value)) {
			super.setValue(value);
		} else throw new Error("Value is not valid!");
	}

	isValid(value) {
		return typeof value === "boolean";
	}
	
}