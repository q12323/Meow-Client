import { Property } from "../Property";

export class PropertyString extends Property {

    /**
     * 
     * @param {string} name 
     * @param {string} defaultValue 
     * @param {array} values 
     */
    constructor(name, defaultValue, values) {
        super(name, "STRING", defaultValue);
        
        this.values = values;

        
    }

    getProperValue(value) {
        return String(value);
    }

    getTypeInfo() {
        return this.getValues().join(", ");
    }

    getFormattedValue() {
        return ("&9" + super.getValue() + "&r");
    }

    getValues() {
        return this.values;
    }

    setValue(value) {
        if (this.isValid(value.toUpperCase())) {
            super.setValue(value.toUpperCase());
        } else {
            throw new Error("Value is not valid!");
        }
    }

    isValid(value) {
        return (this.getValues().includes(value));
    }

}