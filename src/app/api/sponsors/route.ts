import axios from "axios";
import config from "@/config";

export async function GET() {
    const data = await axios
        .get<any[]>(config.SPONSOR_API)
        .then((response) => response.data)
        .catch((err) => {
            throw new Error(`Error to get incubators infos : ${err}`);
        });
    return Response.json(data);
}
