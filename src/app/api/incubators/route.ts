import betagouv from "@/betagouv"
 
export async function GET() {
  const incubator = await betagouv.incubators()
  return Response.json(incubator)
}
