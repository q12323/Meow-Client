const TickEvent = Java.type("net.minecraftforge.fml.common.gameevent.TickEvent");
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook");
const LivingUpdateEvent = Java.type("net.minecraftforge.event.entity.living.LivingEvent$LivingUpdateEvent");
const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer");

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
        try {
            args ??= [];
            this.queue.forEach((task, index) => {
                task.originalIndex = index;
            });

            this.queue.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
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
        } catch (error) {
            error = String(error?.toString() + error?.stack || error);
            console.log(`error while doing tasks ${error}`);
        }
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
        this.scheduledPrePlayerTickTasks = new Tasks();
        this.scheduledPostPlayerTickTasks = new Tasks();

        this.scheduledLowS08Tasks = new Tasks();

        this.scheduledPlayerLivingUpdateTasks = new Tasks();

        this.scheduledC03Tasks = new Tasks();

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

        this.playerTickTrigger = register(TickEvent.PlayerTickEvent, (event) => {
            const entity = event.player;
            if (entity === null) return;
            if (entity !== Player.getPlayer()) return;
            if (event.phase === TickEvent.Phase.END) {
                this.scheduledPostPlayerTickTasks.doTasks(event);
            } else if (event.phase === TickEvent.Phase.START) {
                this.scheduledPrePlayerTickTasks.doTasks(event);
            }
        }).unregister();

        this.lowS08Trigger = register("PacketReceived", (packet, event) => {
            this.scheduledLowS08Tasks.doTasks(packet, event);
        }).setFilteredClass(S08PacketPlayerPosLook).unregister().setPriority(Priority.LOW).unregister();

        this.livingUpdateTrigger = register(LivingUpdateEvent, (event) => {
            const entity = event.entity;
            if (entity === null || entity !== Player.getPlayer()) return;
            this.scheduledPlayerLivingUpdateTasks.doTasks(event);
        }).unregister();

        this.c03Trigger = register("PacketSent", (packet, event) => {
            this.scheduledC03Tasks(packet, event);
        }).setFilteredClass(C03PacketPlayer).unregister();
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

    schedulePrePlayerTickTask(task, ticks, priority) {
        this.scheduledPrePlayerTickTasks.add(new Task(task, ticks, priority));
    }

    schedulePostPlayerTickTask(task, ticks, priority) {
        this.scheduledPostPlayerTickTasks.add(new Task(task, ticks, priority));
    }

    scheduleLowS08Task(task, ticks, priority) {
        this.scheduledLowS08Tasks.add(new Task(task, ticks, priority));
    }

    schedulePlayerLivingUpdateTask(task, ticks, priority) {
        this.scheduledPlayerLivingUpdateTasks.add(new Task(task, ticks, priority));
    }

    scheduleC03Task(task, ticks, priority) {
        this.scheduledC03Tasks.add(new Task(task, ticks, priority));
    }

    register() {
        this.tickTrigger.register();
        this.highTickTrigger.register();
        this.lowS08Trigger.register();
        this.lowestTickTrigger.register();
        this.lowS08Trigger.register();
        this.livingUpdateTrigger.register();
        this.playerTickTrigger.register();
    }
}
