export class Property {

	/**
	 * 
	 * @param {string} name 
	 * @param {string} type 
	 * @param {*} defaultValue 
	 */
	constructor(name, type, defaultValue) {
		this.name = name;
		this.type = type;
		this.defaultValue = defaultValue;
		this.value = defaultValue;

		this.onValueChanged = (value) => {};
		this.setDefaultValue();
	}

	getProperValue(value) {
		return value;
	}

	/**
	 * calls after value changed
	 * @param {callback} callback (value) => { codes... };
	 * @returns property
	 */
	onProperty(callback) {
		this.onValueChanged = callback;
		return this;
	}

	getName() {
		return this.name;
	}

	getType() {
		return this.type;
	}

	getValue() {
		return this.value;
	}

	setValue(value) {
		this.value = value;
		this.onValueChanged(value);
	}

	setDefaultValue() {
		this.setValue(this.defaultValue);
	}

}
