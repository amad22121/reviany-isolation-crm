import { useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate } from "react-router-dom";
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
    repId: role === "representant" ? currentRepId || SALES_REPS[0].id : SALES_REPS[0].id,
    preQual1: "",
    preQual2: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.clientFirstName.trim()) e.clientFirstName = "Requis";
    if (!form.clientLastName.trim()) e.clientLastName = "Requis";
    if (!form.phone.trim()) e.phone = "Requis";
    if (!form.address.trim()) e.address = "Requis";
    if (!form.preQual1.trim()) e.preQual1 = "Requis";
    if (!form.preQual2.trim()) e.preQual2 = "Requis";
    if (!form.notes.trim()) e.notes = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    addAppointment(form);
    toast.success("Rendez-vous créé ! SMS de confirmation envoyé (démo)", {
      description: `Rappel planifié pour ${form.clientFirstName} ${form.clientLastName} — 24h avant.`,
    });
    if (role === "representant") navigate("/rep");
    else navigate("/dashboard");
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const inputClass = (field: string) =>
    `w-full bg-secondary border ${errors[field] ? "border-destructive" : "border-border"} rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-6">Nouveau rendez-vous</h1>
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Prénom *</label>
            <input className={inputClass("clientFirstName")} value={form.clientFirstName} onChange={(e) => update("clientFirstName", e.target.value)} placeholder="Pierre" />
            {errors.clientFirstName && <span className="text-xs text-destructive">{errors.clientFirstName}</span>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nom *</label>
            <input className={inputClass("clientLastName")} value={form.clientLastName} onChange={(e) => update("clientLastName", e.target.value)} placeholder="Lavoie" />
            {errors.clientLastName && <span className="text-xs text-destructive">{errors.clientLastName}</span>}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Téléphone *</label>
          <input className={inputClass("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(514) 555-0100" />
          {errors.phone && <span className="text-xs text-destructive">{errors.phone}</span>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Adresse *</label>
          <input className={inputClass("address")} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="1234 Rue Sainte-Catherine, Montréal, QC" />
          {errors.address && <span className="text-xs text-destructive">{errors.address}</span>}
          {form.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Voir sur Google Maps →
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date *</label>
            <input type="date" className={inputClass("date")} value={form.date} onChange={(e) => update("date", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Heure *</label>
            <input type="time" className={inputClass("time")} value={form.time} onChange={(e) => update("time", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Représentant *</label>
          <select
            className={inputClass("repId")}
            value={form.repId}
            onChange={(e) => update("repId", e.target.value)}
            disabled={role === "representant"}
          >
            {SALES_REPS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Pré-qualification Q1 — Le client est-il propriétaire ? *</label>
          <input className={inputClass("preQual1")} value={form.preQual1} onChange={(e) => update("preQual1", e.target.value)} placeholder="Ex: Oui, propriétaire depuis 5 ans" />
          {errors.preQual1 && <span className="text-xs text-destructive">{errors.preQual1}</span>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Pré-qualification Q2 — Quel service l'intéresse ? *</label>
          <input className={inputClass("preQual2")} value={form.preQual2} onChange={(e) => update("preQual2", e.target.value)} placeholder="Ex: Intéressé par les économies d'énergie" />
          {errors.preQual2 && <span className="text-xs text-destructive">{errors.preQual2}</span>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Notes *</label>
          <textarea className={inputClass("notes") + " min-h-[80px]"} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Informations supplémentaires..." />
          {errors.notes && <span className="text-xs text-destructive">{errors.notes}</span>}
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Créer le rendez-vous et envoyer SMS (démo)
        </button>
      </form>
    </div>
  );
};

export default AddAppointmentPage;
