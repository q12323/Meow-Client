const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");

class Task {
    constructor(callback, ticks = 0, priority = 0) {
        this.callback = callback;
        this.ticks = ticks;
        this.priority = priority;
        this.originalIndex = -1;
    }

    execute(...args) {
        this.callback(...args);
    }
}

class Tasks {
    constructor() {
        this.queue = [];
    }

    add(task) {
        this.queue.push(task);
    }
    
    doTasks(...args) {
        args ??= [];
        this.queue.forEach((task, index) => {
            task.originalIndex = index;
        });

        this.queue.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.originalIndex - b.originalIndex;
        });

        const after = [];

        while (this.queue.length) {
            let task = this.queue.shift();
            if (task.ticks > 0) {
                task.ticks--;
                after.push(task);
                continue;
            }
            task.execute(...args);
        }

        after.forEach(t => this.queue.push(t));
    }
}

export const Scheduler = new class {

    constructor() {
        this.scheduledPreTickTasks = new Tasks();
        this.scheduledPostTickTasks = new Tasks();
        this.scheduledHighPreTickTasks = new Tasks();
        this.scheduledHighPostTickTasks = new Tasks();
        this.scheduledLowestPreTickTasks = new Tasks();
        this.scheduledLowestPostTickTasks = new Tasks();

        this.scheduledLowS08Tasks = new Tasks();
        

        this.tickTrigger = register(TickEvent.ClientTickEvent, (event) => {
            if (event.phase === TickEvent.Phase.START) {
                this.scheduledPreTickTasks.doTasks();
            } else if (event.phase === TickEvent.Phase.END) {
                Scheduler.scheduledPostTickTasks.doTasks(event);
            }
        }).unregister();

        this.highTickTrigger = register(TickEvent.ClientTickEvent, (event) => {
            if (event.phase === TickEvent.Phase.START) {
                this.scheduledHighPreTickTasks.doTasks();
            } else if (event.phase === TickEvent.Phase.END) {
                this.scheduledHighPostTickTasks.doTasks();
            }
        }).unregister().setPriority(Priority.HIGH).unregister();

        this.lowestTickTrigger = register(TickEvent.ClientTickEvent, (event) => {
            if (event.phase === TickEvent.Phase.START) {
                this.scheduledLowestPreTickTasks.doTasks(event);
            } else if (event.phase === TickEvent.Phase.END) {
                this.scheduledLowestPostTickTasks.doTasks(event);
            }
        }).unregister().setPriority(Priority.LOWEST).unregister();

        this.lowS08Trigger = register("PacketReceived", (packet, event) => {
            this.scheduledLowS08Tasks.doTasks(packet, event);
        }).setFilteredClass(S08PacketPlayerPosLook).unregister().setPriority(Priority.LOW).unregister();
    }

    schedulePreTickTask(task, ticks, priority) {
        this.scheduledPreTickTasks.add(new Task(task, ticks, priority));
    }

    schedulePostTickTask(task, ticks, priority) {
        this.scheduledPostTickTasks.add(new Task(task, ticks, priority));
    }

    scheduleHighPreTickTask(task, ticks, priority) {
        this.scheduledHighPreTickTasks.add(new Task(task, ticks, priority));
    }

    scheduleHighPostTickTask(task, ticks, priority) {
        this.scheduledHighPostTickTasks.add(new Task(task, ticks, priority));
    }

    scheduleLowestPreTickTask(task, ticks, priority) {
        this.scheduledLowestPreTickTasks.add(new Task(task, ticks, priority));
    }

    scheduleLowestPostTickTask(task, ticks, priority) {
        this.scheduledLowestPostTickTasks.add(new Task(task, ticks, priority));
    }


    scheduleLowS08Task(task, ticks, priority) {
        this.scheduledLowS08Tasks.add(new Task(task, ticks, priority));
    }

    register() {
        this.tickTrigger.register();
        this.highTickTrigger.register();
        this.lowS08Trigger.register();
        this.lowestTickTrigger.register();
        this.lowS08Trigger.register();
    }
}