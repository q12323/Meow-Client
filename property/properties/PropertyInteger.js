import { Property } from "../Property";

export class PropertyInteger extends Property {

    minValue;
    maxValue;


    /**
     * 
     * @param {string} name 
     * @param {integer} defaultValue 
     * @param {integer} minValue 
     * @param {integer} maxValue 
     */
    constructor(name, defaultValue, minValue, maxValue) {
        super(name, "INTEGER", defaultValue);

        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    getProperValue(value) {
        return Number(value);
    }

    getTypeInfo() {
        return this.getMinValue() + "-" + this.getMaxValue();
    }

    getFormattedValue() {
        return ("&e" + super.getValue() + "&r");
    }

    getMinValue() {
        return this.minValue;
    }

    setMinValue(minValue) {
        this.minValue = minValue;
    }

    getMaxValue() {
        return this.maxValue;
    }

    setMaxValue(maxValue) {
        this.maxValue = maxValue;
    }

    setValue(value) {
        if (this.isValid(value)) {
            super.setValue(value);
        } else {
            throw new Error("Value is not valid!");
        }
    }

    isValid(value) {
        return (Number.isInteger(value) && (this.getMinValue() <= value && value <= this.getMaxValue()));
    }

}