import betagouv from "@/betagouv"
 
export async function GET() {
  const sponsors = await betagouv.sponsors()
  return Response.json(sponsors)
}
