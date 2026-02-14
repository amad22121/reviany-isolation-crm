import { useState } from "react";
import { useCrm } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/crm-store";
import { toast } from "sonner";

const AddAppointmentPage = () => {
  const { addAppointment } = useCrm();
  const { role, currentRepId } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clientFirstName: "",
    clientLastName: "",
    phone: "",
    address: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    repId: role === "sales_rep" ? currentRepId || SALES_REPS[0].id : SALES_REPS[0].id,
    preQual1: "",
    preQual2: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.clientFirstName.trim()) e.clientFirstName = "Required";
    if (!form.clientLastName.trim()) e.clientLastName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.preQual1.trim()) e.preQual1 = "Required";
    if (!form.preQual2.trim()) e.preQual2 = "Required";
    if (!form.notes.trim()) e.notes = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    addAppointment(form);
    toast.success("Appointment created! SMS Confirmation Sent (demo)", {
      description: `Scheduled reminder for ${form.clientFirstName} ${form.clientLastName} — 24h before.`,
    });
    if (role === "manager") navigate("/dashboard");
    else navigate("/rep");
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const inputClass = (field: string) =>
    `w-full bg-secondary border ${errors[field] ? "border-destructive" : "border-border"} rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-6">New Appointment</h1>
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">First Name *</label>
            <input className={inputClass("clientFirstName")} value={form.clientFirstName} onChange={(e) => update("clientFirstName", e.target.value)} placeholder="Pierre" />
            {errors.clientFirstName && <span className="text-xs text-destructive">{errors.clientFirstName}</span>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Last Name *</label>
            <input className={inputClass("clientLastName")} value={form.clientLastName} onChange={(e) => update("clientLastName", e.target.value)} placeholder="Lavoie" />
            {errors.clientLastName && <span className="text-xs text-destructive">{errors.clientLastName}</span>}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Phone Number *</label>
          <input className={inputClass("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(514) 555-0100" />
          {errors.phone && <span className="text-xs text-destructive">{errors.phone}</span>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Address *</label>
          <input className={inputClass("address")} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="1234 Rue Sainte-Catherine, Montréal, QC" />
          {errors.address && <span className="text-xs text-destructive">{errors.address}</span>}
          {form.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              View on Google Maps →
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date *</label>
            <input type="date" className={inputClass("date")} value={form.date} onChange={(e) => update("date", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Time *</label>
            <input type="time" className={inputClass("time")} value={form.time} onChange={(e) => update("time", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Sales Rep *</label>
          <select
            className={inputClass("repId")}
            value={form.repId}
            onChange={(e) => update("repId", e.target.value)}
            disabled={role === "sales_rep"}
          >
            {SALES_REPS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Pre-Qualification Q1 — Is the client a homeowner? *</label>
          <input className={inputClass("preQual1")} value={form.preQual1} onChange={(e) => update("preQual1", e.target.value)} placeholder="e.g. Yes, homeowner for 5 years" />
          {errors.preQual1 && <span className="text-xs text-destructive">{errors.preQual1}</span>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Pre-Qualification Q2 — What service interests them? *</label>
          <input className={inputClass("preQual2")} value={form.preQual2} onChange={(e) => update("preQual2", e.target.value)} placeholder="e.g. Interested in energy savings" />
          {errors.preQual2 && <span className="text-xs text-destructive">{errors.preQual2}</span>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Notes *</label>
          <textarea className={inputClass("notes") + " min-h-[80px]"} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any additional information..." />
          {errors.notes && <span className="text-xs text-destructive">{errors.notes}</span>}
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Create Appointment & Send SMS (demo)
        </button>
      </form>
    </div>
  );
};

export default AddAppointmentPage;
