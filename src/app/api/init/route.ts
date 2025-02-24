import { NextResponse } from "next/server";

import { scheduleCronTasks } from "@/server/queueing/schedule";
import { gracefulExit, registerGracefulExit } from "@/utils/systemExit";

let init = false;

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
