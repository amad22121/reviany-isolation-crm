import { useState } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const CITY_CHIPS = ["Montréal", "Laval", "Longueuil", "Terrebonne", "Mascouche"];

const AddAppointmentPage = () => {
  const { addAppointment, appointments } = useCrm();
  const { role, currentRepId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill from backlog conversion
  const backlogId = searchParams.get("backlog");
  const backlogItem = backlogId ? appointments.find((a) => a.id === backlogId && a.status === "Backlog") : null;

  const [form, setForm] = useState({
    fullName: backlogItem?.fullName || "",
    phone: backlogItem?.phone || "",
    address: backlogItem?.address || "",
    city: backlogItem?.city || "",
    origin: backlogItem?.origin || "",
    date: backlogItem?.date || new Date().toISOString().split("T")[0],
    time: backlogItem?.time || "09:00",
    repId: backlogItem?.repId || (role === "representant" ? currentRepId || SALES_REPS[0].id : SALES_REPS[0].id),
    preQual1: backlogItem?.preQual1 || "",
    preQual2: backlogItem?.preQual2 || "",
    notes: backlogItem?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (isBacklog: boolean) => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Requis";
    if (!form.phone.trim()) e.phone = "Requis";
    if (!form.address.trim()) e.address = "Requis";
    if (!form.city.trim()) e.city = "Requis";
    if (!isBacklog && !form.date) e.date = "Requis";
    if (!isBacklog && !form.time) e.time = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(false)) return;

    if (backlogItem) {
      // Converting from backlog - update the existing record
      const { convertBacklogToAppointment } = useCrm.getState();
      convertBacklogToAppointment(backlogItem.id, {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        origin: form.origin || undefined,
        date: form.date,
        time: form.time,
        repId: form.repId,
        preQual1: form.preQual1,
        preQual2: form.preQual2,
        notes: form.notes,
      });
      toast.success("Rendez-vous créé depuis le backlog.");
    } else {
      addAppointment({
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        origin: form.origin || undefined,
        date: form.date,
        time: form.time,
        repId: form.repId,
        preQual1: form.preQual1,
        preQual2: form.preQual2,
        notes: form.notes,
        status: "En attente",
      });
      toast.success("Rendez-vous créé.");
    }
    if (role === "representant") navigate("/rep");
    else navigate("/dashboard");
  };

  const handleBacklog = () => {
    if (!validate(true)) return;
    addAppointment({
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      city: form.city,
      origin: form.origin || undefined,
      date: form.date || "",
      time: form.time || "",
      repId: form.repId,
      preQual1: form.preQual1,
      preQual2: form.preQual2,
      notes: form.notes,
      status: "Backlog",
    });
    toast.success("Ajouté au backlog.");
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
      <h1 className="text-xl font-bold text-foreground mb-6">
        {backlogItem ? "Convertir en rendez-vous" : "Nouveau rendez-vous"}
      </h1>
      <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
        {/* Full Name */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Nom du client *</label>
          <input className={inputClass("fullName")} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Ex: Pierre Lavoie" />
          {errors.fullName && <span className="text-xs text-destructive">{errors.fullName}</span>}
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Téléphone *</label>
          <input className={inputClass("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(514) 555-0100" />
          {errors.phone && <span className="text-xs text-destructive">{errors.phone}</span>}
        </div>

        {/* Address */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Adresse *</label>
          <input className={inputClass("address")} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="1234 Rue Sainte-Catherine" />
          <p className="text-[11px] text-muted-foreground mt-1">Adresse civique seulement (sans la ville).</p>
          {errors.address && <span className="text-xs text-destructive">{errors.address}</span>}
          {form.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${form.address}, ${form.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Voir sur Google Maps →
            </a>
          )}
        </div>

        {/* City */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Ville *</label>
          <input className={inputClass("city")} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Ex: Montréal" />
          {errors.city && <span className="text-xs text-destructive">{errors.city}</span>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {CITY_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update("city", c)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  form.city === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Date *</label>
            <input type="date" className={inputClass("date")} value={form.date} onChange={(e) => update("date", e.target.value)} />
            {errors.date && <span className="text-xs text-destructive">{errors.date}</span>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Heure *</label>
            <input type="time" className={inputClass("time")} value={form.time} onChange={(e) => update("time", e.target.value)} />
            {errors.time && <span className="text-xs text-destructive">{errors.time}</span>}
          </div>
        </div>

        {/* Rep */}
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

        {/* Origin */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Origine / Profil (optionnel)</label>
          <input className={inputClass("origin")} value={form.origin} onChange={(e) => update("origin", e.target.value)} placeholder="Ex: Arabe / Haïtien / Québécois / etc." />
        </div>

        {/* PreQual */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Question A</label>
          <input className={inputClass("preQual1")} value={form.preQual1} onChange={(e) => update("preQual1", e.target.value)} placeholder="Écrivez ici" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Question B</label>
          <input className={inputClass("preQual2")} value={form.preQual2} onChange={(e) => update("preQual2", e.target.value)} placeholder="Écrivez ici" />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Notes</label>
          <textarea className={inputClass("notes") + " min-h-[80px]"} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Écrivez vos notes ici" />
        </div>

        {/* Two action buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            {backlogItem ? "Convertir en rendez-vous" : "Créer le rendez-vous"}
          </button>
          {!backlogItem && (
            <button
              type="button"
              onClick={handleBacklog}
              className="w-full border border-border text-foreground font-medium py-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Ajouter à la liste (backlog)
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddAppointmentPage;
