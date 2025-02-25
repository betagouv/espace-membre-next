import { NextResponse } from "next/server";

import { scheduleCronTasks } from "@/server/queueing/schedule";
import { gracefulExit, registerGracefulExit } from "@/utils/systemExit";

declare global {
    var init: boolean | undefined;
}

// Make it unique singleton across Next.js module compilations
export let init = global.init || false;
if (process.env.NODE_ENV !== "production") global.init = init;

export async function GET() {
    if (!init) {
        init = true;

        try {
            // Register the event listener for termination signals
            registerGracefulExit();

            await scheduleCronTasks();

            console.log("All services have been initialized");
        } catch (error) {
            await gracefulExit(error as Error);
            return NextResponse.json(
                { message: "Failed to initialize some services" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ message: "Initialized" });
}

export const dynamic = "force-dynamic"; // Ensures the route is always executed dynamically

export default GET;
