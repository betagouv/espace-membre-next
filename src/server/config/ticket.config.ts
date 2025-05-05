import AirtableTicketService from "@/lib/airtableTicketService";
import CripsTicketService from "@/lib/crispTicketService";

const ticketServiceInstance = new AirtableTicketService()// new CripsTicketService();

export default ticketServiceInstance;