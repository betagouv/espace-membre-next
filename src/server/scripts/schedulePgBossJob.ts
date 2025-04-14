import { startBossClientInstance } from "../queueing/client";
import { scheduleCronTasks } from "../queueing/schedule";

startBossClientInstance();
scheduleCronTasks();
