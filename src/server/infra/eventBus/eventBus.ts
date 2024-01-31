import config from "@/server/config";
import InMemoryEventBus from "../inMemoryEventBus";
import makeRedisEventBus from "../redis";

export interface IEventBus {
    init: any;
    consume: any;
    produce: any;
}

const EventBus: IEventBus =
    process.env.NODE_ENV === "test" || process.env.CI
        ? new InMemoryEventBus()
        : makeRedisEventBus({ REDIS_URL: config.REDIS_URL });

export default EventBus;
