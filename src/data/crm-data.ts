export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
}

export interface Appointment {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  phone: string;
  address: string;
  date: string;
  time: string;
  repId: string;
  preQual1: string;
  preQual2: string;
  notes: string;
  status: "Pending" | "Confirmed" | "No-Show" | "Completed" | "Cancelled";
  smsScheduled: boolean;
  createdAt: string;
}

export const SALES_REPS: SalesRep[] = [
  { id: "rep1", name: "Marc-André Dupont", avatar: "MD" },
  { id: "rep2", name: "Sophie Tremblay", avatar: "ST" },
  { id: "rep3", name: "Jean-Philippe Roy", avatar: "JR" },
  { id: "rep4", name: "Isabelle Gagné", avatar: "IG" },
  { id: "rep5", name: "Alexandre Bouchard", avatar: "AB" },
];

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "a1", clientFirstName: "Pierre", clientLastName: "Lavoie", phone: "(514) 555-0101", address: "1234 Rue Sainte-Catherine O, Montréal, QC H3G 1P1", date: today, time: "09:00", repId: "rep1", preQual1: "Yes, homeowner for 5 years", preQual2: "Interested in energy savings", notes: "Prefers morning appointments", status: "Confirmed", smsScheduled: true, createdAt: today },
  { id: "a2", clientFirstName: "Marie", clientLastName: "Côté", phone: "(514) 555-0102", address: "567 Boulevard Saint-Laurent, Montréal, QC H2T 1S6", date: today, time: "10:30", repId: "rep2", preQual1: "Homeowner, recently renovated", preQual2: "Looking for insulation upgrade", notes: "Has a dog, ring doorbell", status: "Pending", smsScheduled: true, createdAt: today },
  { id: "a3", clientFirstName: "François", clientLastName: "Bélanger", phone: "(514) 555-0103", address: "890 Avenue du Parc, Montréal, QC H2V 4E7", date: today, time: "11:00", repId: "rep1", preQual1: "Yes, owns duplex", preQual2: "High energy bills concern", notes: "French only", status: "Confirmed", smsScheduled: true, createdAt: today },
  { id: "a4", clientFirstName: "Nathalie", clientLastName: "Gagnon", phone: "(438) 555-0104", address: "2345 Rue Sherbrooke E, Montréal, QC H2K 1E5", date: today, time: "13:00", repId: "rep3", preQual1: "Owner since 2018", preQual2: "Wants window replacement quotes", notes: "Call before arriving", status: "No-Show", smsScheduled: true, createdAt: today },
  { id: "a5", clientFirstName: "Claude", clientLastName: "Morin", phone: "(514) 555-0105", address: "678 Rue Notre-Dame O, Montréal, QC H3C 1K1", date: today, time: "14:00", repId: "rep4", preQual1: "Homeowner, 3-bedroom", preQual2: "Interested in solar panels", notes: "Parking available in driveway", status: "Pending", smsScheduled: true, createdAt: today },
  { id: "a6", clientFirstName: "Sylvie", clientLastName: "Pelletier", phone: "(438) 555-0106", address: "1111 Rue de la Montagne, Montréal, QC H3G 1Z2", date: today, time: "15:30", repId: "rep5", preQual1: "Yes, condo owner", preQual2: "Heating system upgrade", notes: "Buzzer code #4521", status: "Confirmed", smsScheduled: true, createdAt: today },
  { id: "a7", clientFirstName: "Luc", clientLastName: "Bergeron", phone: "(514) 555-0107", address: "3456 Avenue Papineau, Montréal, QC H2K 4J5", date: today, time: "16:00", repId: "rep2", preQual1: "Homeowner, built 2005", preQual2: "Roof inspection needed", notes: "Side entrance", status: "Pending", smsScheduled: true, createdAt: today },
  { id: "a8", clientFirstName: "Annie", clientLastName: "Fortin", phone: "(438) 555-0108", address: "789 Rue Rachel E, Montréal, QC H2J 2H7", date: today, time: "09:30", repId: "rep3", preQual1: "Owner, triplex", preQual2: "Government rebate eligible", notes: "Bring brochures in French", status: "Completed", smsScheduled: true, createdAt: today },
  { id: "a9", clientFirstName: "Martin", clientLastName: "Desjardins", phone: "(514) 555-0109", address: "2222 Boulevard Décarie, Montréal, QC H4A 3J5", date: today, time: "10:00", repId: "rep4", preQual1: "Yes, single family home", preQual2: "AC unit replacement", notes: "Has existing quote from competitor", status: "Confirmed", smsScheduled: true, createdAt: today },
  { id: "a10", clientFirstName: "Chantal", clientLastName: "Lemieux", phone: "(438) 555-0110", address: "555 Avenue Laurier E, Montréal, QC H2J 1E1", date: today, time: "11:30", repId: "rep5", preQual1: "Homeowner 10+ years", preQual2: "Full home energy audit", notes: "Works from home", status: "Pending", smsScheduled: true, createdAt: today },
  { id: "a11", clientFirstName: "Robert", clientLastName: "Paquette", phone: "(514) 555-0111", address: "1800 Rue Ontario E, Montréal, QC H2K 1V1", date: yesterday, time: "09:00", repId: "rep1", preQual1: "Owner, bungalow", preQual2: "Basement waterproofing", notes: "Completed successfully", status: "Completed", smsScheduled: true, createdAt: yesterday },
  { id: "a12", clientFirstName: "Diane", clientLastName: "Simard", phone: "(438) 555-0112", address: "430 Rue Beaubien E, Montréal, QC H2S 1R8", date: yesterday, time: "10:30", repId: "rep2", preQual1: "Yes, homeowner", preQual2: "Siding replacement", notes: "No-show, reschedule needed", status: "No-Show", smsScheduled: true, createdAt: yesterday },
  { id: "a13", clientFirstName: "Jacques", clientLastName: "Thibault", phone: "(514) 555-0113", address: "675 Rue Masson, Montréal, QC H2C 1B9", date: yesterday, time: "13:00", repId: "rep3", preQual1: "Homeowner, split-level", preQual2: "Interested in heat pump", notes: "Confirmed and completed", status: "Completed", smsScheduled: true, createdAt: yesterday },
  { id: "a14", clientFirstName: "Hélène", clientLastName: "Savard", phone: "(438) 555-0114", address: "999 Avenue Van Horne, Montréal, QC H2V 1J7", date: yesterday, time: "14:30", repId: "rep4", preQual1: "Owner since 2015", preQual2: "Window and door upgrade", notes: "Confirmed", status: "Confirmed", smsScheduled: true, createdAt: yesterday },
  { id: "a15", clientFirstName: "Michel", clientLastName: "Dubois", phone: "(514) 555-0115", address: "1350 Boulevard de Maisonneuve E, Montréal, QC H2L 2A5", date: yesterday, time: "16:00", repId: "rep5", preQual1: "Condo owner", preQual2: "HVAC maintenance", notes: "Evening preferred next time", status: "Completed", smsScheduled: true, createdAt: yesterday },
];
