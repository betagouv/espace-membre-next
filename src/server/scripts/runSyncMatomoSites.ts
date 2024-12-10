import { matomoClient } from "../config/matomo.config";
import { syncMatomoSites } from "../schedulers/serviceScheduler/syncMatomoSites";

syncMatomoSites(matomoClient);
