import { PropertyBoolean } from "../../property/properties/PropertyBoolean";
import { PropertyInteger } from "../../property/properties/PropertyInteger";
import { PropertyNumber } from "../../property/properties/PropertyNumber";
import { PropertyPercentage } from "../../property/properties/PropertyPercentage";
import { PropertyString } from "../../property/properties/PropertyString";

import { Module } from "../Module";

export class TestModule extends Module {
	
	constructor() {

		super("TestModule", true, 0, false);

		// this.properties = new Set();

		// this.properties.add(new PropertyBoolean("bool-value", true));
		// this.properties.add(new PropertyInteger("int-val", 2, 0, 10));
		// this.properties.add(new PropertyNumber("num-val", 3.2, 0.5, 7.8));
		// this.properties.add(new PropertyString("str-val", "AUTO", ["NONE", "AUTO", "LEGIT"]));
		// this.properties.add(new PropertyPercentage("per-val", 50, 0, 100));
		
		this.boolVal = new PropertyBoolean("bool-value", true);
		this.intVal = new PropertyInteger("int-val", 2, 0, 10);
		this.numVal = new PropertyNumber("num-val", 3.2, 0.5, 7.8);
		this.strVal = new PropertyString("str-val", "AUTO", ["NONE", "AUTO", "LEGIT"]);
		this.perVal = new PropertyPercentage("per-val", 50, 0, 100);
	}
	
}