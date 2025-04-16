import { Property } from "../Property";

export class PropertyPercentage extends Property {

    

    minValue;
    maxValue;


    /**
     * 
     * @param {string} name 
     * @param {number} defaultValue 
     * @param {number} minValue 
     * @param {number} maxValue 
     */
    constructor(name, defaultValue, minValue, maxValue) {
        super(name, "PERCENTAGE", defaultValue);

        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    getProperValue(value) {
        return Number(value);
    }

    getTypeInfo() {
        return this.getMinValue() + "-" + this.getMaxValue() + "%";
    }

    getFormattedValue() {
        return ("&b" + super.getValue() + "%&r");
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
        return (this.getMinValue() <= value && value <= this.getMaxValue());
    }

}