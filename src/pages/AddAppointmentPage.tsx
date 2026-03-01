import { useState, useMemo } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ArrowLeft } from "lucide-react";

const CITY_CHIPS = ["Laval", "Montréal", "Repentigny", "Terrebonne"];
const LEAD_SOURCE_OPTIONS = ["Door-to-door", "Référence", "Facebook", "Autre"];
const WORK_DONE_OPTIONS = ["Oui", "Non", "Je ne sais pas"];
const INSPECTION_OPTIONS = ["Oui", "Non", "Je ne sais pas"];
const DECISION_DELAY_OPTIONS = ["0–7 jours", "1–2 semaines", "2–4 semaines", "1 mois+", "Je ne sais pas"];

interface PreQualState {
  prior_work_done: string;
  job_sector: string;
  years_at_address: string;
  recent_or_future_work: string;
  inspection_report: string;
  inspection_by: string;
  decision_timeline: string;
}

const INITIAL_PREQUAL: PreQualState = {
  prior_work_done: "",
  job_sector: "",
  years_at_address: "",
  recent_or_future_work: "",
  inspection_report: "",
  inspection_by: "",
  decision_timeline: "",
};

const AddAppointmentPage = () => {
  const { addAppointment, appointments, convertBacklogToAppointment } = useCrm();
  const { role, currentRepId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const backlogId = searchParams.get("backlog");
  const backlogItem = backlogId ? appointments.find((a) => a.id === backlogId && a.status === "Backlog") : null;

  const [fullName, setFullName] = useState(backlogItem?.fullName || "");
  const [phone, setPhone] = useState(backlogItem?.phone || "");
  const [address, setAddress] = useState(backlogItem?.address || "");
  const [city, setCity] = useState(backlogItem?.city || "");
  const [culturalOrigin, setCulturalOrigin] = useState("");
  const [leadSource, setLeadSource] = useState(backlogItem?.origin || "Door-to-door");
  const [leadSourceOther, setLeadSourceOther] = useState("");
  const [date, setDate] = useState(backlogItem?.date || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(backlogItem?.time || "09:00");
  const [repId, setRepId] = useState(backlogItem?.repId || (role === "representant" ? currentRepId || SALES_REPS[0].id : SALES_REPS[0].id));
  const [notes, setNotes] = useState(backlogItem?.notes || "");
  const [preQual, setPreQual] = useState<PreQualState>(INITIAL_PREQUAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const adresseComplete = useMemo(() => {
    if (!address.trim() || !city.trim()) return "";
    return `${address.trim()}, ${city.trim()}, QC`;
  }, [address, city]);

  const effectiveLeadSource = leadSource === "Autre" ? leadSourceOther : leadSource;

  const validate = (isBacklog: boolean) => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Requis";
    if (!phone.trim()) e.phone = "Requis";
    else if (phone.replace(/\D/g, "").length < 10) e.phone = "Min. 10 chiffres";
    if (!address.trim()) e.address = "Requis";
    if (!city.trim()) e.city = "Requis";
    if (!leadSource) e.leadSource = "Requis";
    if (leadSource === "Autre" && !leadSourceOther.trim()) e.leadSourceOther = "Requis";
    if (!isBacklog && !date) e.date = "Requis";
    if (!isBacklog && !time) e.time = "Requis";
    // Prequalification
    if (!preQual.prior_work_done) e.prior_work_done = "Requis";
    if (!preQual.years_at_address) e.years_at_address = "Requis";
    else {
      const y = Number(preQual.years_at_address);
      if (isNaN(y) || y < 0 || y > 60) e.years_at_address = "Entre 0 et 60";
    }
    if (!preQual.inspection_report) e.inspection_report = "Requis";
    if (preQual.inspection_report === "Oui") {
      if (!preQual.inspection_by.trim()) e.inspection_by = "Requis";
      if (!preQual.decision_timeline) e.decision_timeline = "Requis";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPreQualString = () => {
    const parts = [
      `Travail réalisé: ${preQual.prior_work_done}`,
      preQual.job_sector ? `Secteur: ${preQual.job_sector}` : null,
      `Années propriétaire: ${preQual.years_at_address}`,
      preQual.recent_or_future_work ? `Travaux: ${preQual.recent_or_future_work}` : null,
      `Inspection: ${preQual.inspection_report}`,
      preQual.inspection_report === "Oui" ? `Inspecteur: ${preQual.inspection_by}` : null,
      preQual.inspection_report === "Oui" ? `Délai décision: ${preQual.decision_timeline}` : null,
    ];
    return parts.filter(Boolean).join(" | ");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(false)) return;

    const payload = {
      fullName,
      phone,
      address: adresseComplete || address,
      city,
      origin: effectiveLeadSource || undefined,
      culturalOrigin: culturalOrigin || undefined,
      leadSource: effectiveLeadSource || undefined,
      date,
      time,
      repId,
      preQual1: buildPreQualString(),
      preQual2: "",
      notes,
      status: "Planifié" as const,
    };

    if (backlogItem) {
      convertBacklogToAppointment(backlogItem.id, payload);
      toast.success("Rendez-vous créé depuis le backlog.");
    } else {
      addAppointment(payload);
      toast.success("Rendez-vous créé.");
    }
    // TODO: navigate to created appointment's fiche client once we have client routing
    if (role === "representant") navigate("/rep");
    else navigate("/appointments");
  };

  const handleBacklog = () => {
    if (!validate(true)) return;
    addAppointment({
      fullName,
      phone,
      address: adresseComplete || address,
      city,
      origin: effectiveLeadSource || undefined,
      culturalOrigin: culturalOrigin || undefined,
      leadSource: effectiveLeadSource || undefined,
      date: date || "",
      time: time || "",
      repId,
      preQual1: buildPreQualString(),
      preQual2: "",
      notes,
      status: "Backlog",
    });
    toast.success("Ajouté au backlog.");
    navigate("/backlog");
  };

  const updatePreQual = (field: keyof PreQualState, value: string) => {
    setPreQual((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const fieldError = (field: string) =>
    errors[field] ? <span className="text-xs text-destructive">{errors[field]}</span> : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">
          {backlogItem ? "Convertir en rendez-vous" : "Nouveau rendez-vous"}
        </h1>
      </div>

      <form onSubmit={handleCreate} className="space-y-5">
        {/* ── Section 1: Infos client ── */}
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informations client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Nom */}
            <div className="space-y-1">
              <Label className="text-xs">Nom complet *</Label>
              <Input
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
                placeholder="Ex: Jean Tremblay"
                className={errors.fullName ? "border-destructive" : ""}
              />
              {fieldError("fullName")}
            </div>
            {/* Téléphone */}
            <div className="space-y-1">
              <Label className="text-xs">Téléphone *</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
                placeholder="Ex: 514-555-1234"
                className={errors.phone ? "border-destructive" : ""}
              />
              {fieldError("phone")}
            </div>
            {/* Adresse */}
            <div className="space-y-1">
              <Label className="text-xs">Adresse civique *</Label>
              <Input
                value={address}
                onChange={(e) => { setAddress(e.target.value); clearError("address"); }}
                placeholder="Ex: 1234 Rue Sainte-Catherine"
                className={errors.address ? "border-destructive" : ""}
              />
              {fieldError("address")}
            </div>
            {/* Ville */}
            <div className="space-y-1">
              <Label className="text-xs">Ville *</Label>
              <Input
                value={city}
                onChange={(e) => { setCity(e.target.value); clearError("city"); }}
                placeholder="Ex: Laval"
                className={errors.city ? "border-destructive" : ""}
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {CITY_CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCity(c); clearError("city"); }}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors ${
                      city === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {fieldError("city")}
            </div>
          </div>

          {/* Adresse complète calculée */}
          {adresseComplete && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-md px-3 py-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{adresseComplete}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseComplete)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-auto shrink-0"
              >
                Google Maps →
              </a>
            </div>
          )}

          {/* Origine culturelle + Source du lead */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Origine / profil culturel</Label>
              <Input
                value={culturalOrigin}
                onChange={(e) => setCulturalOrigin(e.target.value)}
                placeholder="Ex: Arabe, Haïtienne, Québécoise, etc."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Source du lead *</Label>
              <Select value={leadSource} onValueChange={(v) => { setLeadSource(v); clearError("leadSource"); }}>
                <SelectTrigger className={errors.leadSource ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner la source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("leadSource")}
            </div>
          </div>
          {leadSource === "Autre" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-start-2 space-y-1">
                <Label className="text-xs">Préciser la source *</Label>
                <Input
                  value={leadSourceOther}
                  onChange={(e) => { setLeadSourceOther(e.target.value); clearError("leadSourceOther"); }}
                  placeholder="Préciser..."
                  className={errors.leadSourceOther ? "border-destructive" : ""}
                />
                {fieldError("leadSourceOther")}
              </div>
            </div>
          )}
        </div>

        {/* ── Section 2: RDV info ── */}
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Rendez-vous</h2>
          <div className="grid grid-cols-2 gap-4 overflow-hidden">
            <div className="space-y-1 min-w-0 overflow-hidden">
              <Label className="text-xs">Date *</Label>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); clearError("date"); }} className={`w-full min-w-0 max-w-full ${errors.date ? "border-destructive" : ""}`} />
              {fieldError("date")}
            </div>
            <div className="space-y-1 min-w-0 overflow-hidden">
              <Label className="text-xs">Heure *</Label>
              <Input type="time" value={time} onChange={(e) => { setTime(e.target.value); clearError("time"); }} className={`w-full min-w-0 max-w-full ${errors.time ? "border-destructive" : ""}`} />
              {fieldError("time")}
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-xs">Représentant</Label>
            <Select value={repId} onValueChange={setRepId} disabled={role === "representant"}>
              <SelectTrigger className="w-full min-w-0 max-w-full truncate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALES_REPS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Section 3: Préqualification ── */}
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Préqualification</h2>
          {/* BLOCK 1 – Primary triggers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Est-ce que ce travail a déjà été réalisé ? *</Label>
              <Select value={preQual.prior_work_done} onValueChange={(v) => updatePreQual("prior_work_done", v)}>
                <SelectTrigger className={errors.prior_work_done ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_DONE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldError("prior_work_done")}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ont-ils déjà eu un rapport d'inspection ? *</Label>
              <Select value={preQual.inspection_report} onValueChange={(v) => updatePreQual("inspection_report", v)}>
                <SelectTrigger className={errors.inspection_report ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldError("inspection_report")}
            </div>
          </div>

          {/* BLOCK 2 – Conditional inspection details */}
          {preQual.inspection_report === "Oui" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Par qui a-t-il été fait ? *</Label>
                <Input
                  value={preQual.inspection_by}
                  onChange={(e) => updatePreQual("inspection_by", e.target.value)}
                  placeholder="Ex: Inspecteur X / firme Y"
                  className={errors.inspection_by ? "border-destructive" : ""}
                />
                {fieldError("inspection_by")}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quels sont les délais de décision ? *</Label>
                <Select value={preQual.decision_timeline} onValueChange={(v) => updatePreQual("decision_timeline", v)}>
                  <SelectTrigger className={errors.decision_timeline ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_DELAY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldError("decision_timeline")}
              </div>
            </div>
          )}

          {/* BLOCK 3 – Owner profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Durée de propriété à cette adresse (années) *</Label>
              <Input
                type="number"
                min={0}
                max={60}
                step="0.1"
                value={preQual.years_at_address}
                onChange={(e) => updatePreQual("years_at_address", e.target.value)}
                placeholder="Ex: 1.5"
                className={errors.years_at_address ? "border-destructive" : ""}
              />
              {fieldError("years_at_address")}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dans quel domaine travaillent-ils ?</Label>
              <Input
                value={preQual.job_sector}
                onChange={(e) => updatePreQual("job_sector", e.target.value)}
                placeholder="Ex: Construction, Santé, Bureau, etc."
              />
            </div>
          </div>

          {/* BLOCK 4 – Context */}
          <div className="space-y-1">
            <Label className="text-xs">Ont-ils effectué des travaux dans les dernières années ou prévoient-ils des investissements futurs ?</Label>
            <Textarea
              value={preQual.recent_or_future_work}
              onChange={(e) => updatePreQual("recent_or_future_work", e.target.value)}
              placeholder="Ex: toiture 2024, fenêtres bientôt, etc."
              className="min-h-[50px]"
            />
          </div>
        </div>

        {/* ── Section 4: Notes ── */}
        <div className="glass-card p-4 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note rapide..."
            className="min-h-[60px]"
          />
          {/* TODO: Historique des notes — sera alimenté depuis Supabase */}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-2 pb-4">
          <Button type="submit" className="flex-1">
            {backlogItem ? "Convertir en rendez-vous" : "Créer le rendez-vous"}
          </Button>
          {!backlogItem && (
            <Button type="button" variant="secondary" onClick={handleBacklog} className="flex-1">
              Ajouter à la liste (Backlog)
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="sm:w-auto">
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddAppointmentPage;
