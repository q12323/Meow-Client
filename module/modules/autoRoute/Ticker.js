export const Ticker = new class {
    constructor() {
        this.tick = 0;

        this.tickTrigger = register("Tick", () => {
            this.tick++;
        })
    }

    getTick() {
        return this.tick;
    }
}
