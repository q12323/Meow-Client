export const ModuleList = new class {
    modules = {};

    getModules() {
        return this.modules;
    }

    get(name) {
        return this.modules[name.toLowerCase()] || null;
    }

    getConstructor(name) {
        return this.get(name).constructor;
    }

    add(module) {
        this.modules[module.getName().toLowerCase()] = module;
    }
}