import { IEventBus } from "../eventBus/eventBus";

export default class InMemoryEventBus implements IEventBus {
    queues!: {};

    init(events: string[]) {
        this.queues = {};
        for (const key of events) {
            this.queues[key] = [];
        }
    }

    produce(event, message) {
        this.queues[event] = message;
        return Promise.resolve(null);
    }

    consume(event, cb) {
        const promiseArray: Promise<any>[] = [];
        for (const job of this.queues[event]) {
            promiseArray.push(
                cb(job).catch((res: any) => Promise.resolve(res))
            );
        }
        return Promise.all(promiseArray);
    }
}
