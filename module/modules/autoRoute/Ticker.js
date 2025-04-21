export const Ticker = new class {
    constructor() {
        this.tick = 0;

        this.tickTrigger = register("Tick", () => {
            this.tick++;
        }).unregister().setPriority(Priority.HIGHEST)
    }

    getTick() {
        return this.tick;
    }
}
