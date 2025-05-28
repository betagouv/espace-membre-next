import { startBossClientInstance } from "../queueing/client";
import { scheduleBossCronTasks } from "../queueing/schedule";

const init = async () => {
  await startBossClientInstance();
  await scheduleBossCronTasks();
};
init();
