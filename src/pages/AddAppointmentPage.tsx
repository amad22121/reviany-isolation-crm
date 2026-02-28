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

const CITY_CHIPS = ["Montréal", "Laval", "Longueuil", "Terrebonne", "Mascouche"];
const ORIGIN_OPTIONS = ["Door-to-door", "Référence", "Facebook", "Autre"];
const OWNER_OPTIONS = ["Les deux", "Un seul", "Je ne sais pas"];
const WORK_DONE_OPTIONS = ["Oui", "Non", "Je ne sais pas"];
const YEARS_OPTIONS = ["0–2", "3–5", "6–10", "10+", "Je ne sais pas"];
const INSPECTION_OPTIONS = ["Oui", "Non", "Je ne sais pas"];
const DECISION_DELAY_OPTIONS = ["0–7 jours", "1–2 semaines", "2–4 semaines", "1 mois+", "Je ne sais pas"];

interface PreQualState {
  q1_owners: string;
  q2_work_done: string;
  q3_sector: string;
  q4_years: string;
  q5_renovations: string;
  q6_inspection: string;
  q6a_inspector: string;
  q6b_decision_delay: string;
}

const INITIAL_PREQUAL: PreQualState = {
  q1_owners: "",
  q2_work_done: "",
  q3_sector: "",
  q4_years: "",
  q5_renovations: "",
  q6_inspection: "",
  q6a_inspector: "",
  q6b_decision_delay: "",
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
  const [origin, setOrigin] = useState(backlogItem?.origin || "");
  const [originOther, setOriginOther] = useState("");
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

  const effectiveOrigin = origin === "Autre" ? originOther : origin;

  const validate = (isBacklog: boolean) => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Requis";
    if (!phone.trim()) e.phone = "Requis";
    else if (phone.replace(/\D/g, "").length < 10) e.phone = "Min. 10 chiffres";
    if (!address.trim()) e.address = "Requis";
    if (!city.trim()) e.city = "Requis";
    if (!origin) e.origin = "Requis";
    if (origin === "Autre" && !originOther.trim()) e.originOther = "Requis";
    if (!isBacklog && !date) e.date = "Requis";
    if (!isBacklog && !time) e.time = "Requis";
    // Prequalification
    if (!preQual.q1_owners) e.q1_owners = "Requis";
    if (!preQual.q2_work_done) e.q2_work_done = "Requis";
    if (!preQual.q4_years) e.q4_years = "Requis";
    if (!preQual.q6_inspection) e.q6_inspection = "Requis";
    if (preQual.q6_inspection === "Oui") {
      if (!preQual.q6a_inspector.trim()) e.q6a_inspector = "Requis";
      if (!preQual.q6b_decision_delay) e.q6b_decision_delay = "Requis";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPreQualString = () => {
    const parts = [
      `Propriétaires: ${preQual.q1_owners}`,
      `Travail réalisé: ${preQual.q2_work_done}`,
      preQual.q3_sector ? `Secteur: ${preQual.q3_sector}` : null,
      `Années propriétaire: ${preQual.q4_years}`,
      preQual.q5_renovations ? `Travaux: ${preQual.q5_renovations}` : null,
      `Inspection: ${preQual.q6_inspection}`,
      preQual.q6_inspection === "Oui" ? `Inspecteur: ${preQual.q6a_inspector}` : null,
      preQual.q6_inspection === "Oui" ? `Délai décision: ${preQual.q6b_decision_delay}` : null,
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
      origin: effectiveOrigin || undefined,
      date,
      time,
      repId,
      preQual1: buildPreQualString(),
      preQual2: "",
      notes,
      status: "En attente" as const,
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
      origin: effectiveOrigin || undefined,
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
                placeholder="Ex: Montréal"
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

          {/* Origine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Origine *</Label>
              <Select value={origin} onValueChange={(v) => { setOrigin(v); clearError("origin"); }}>
                <SelectTrigger className={errors.origin ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner l'origine" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("origin")}
            </div>
            {origin === "Autre" && (
              <div className="space-y-1">
                <Label className="text-xs">Préciser l'origine *</Label>
                <Input
                  value={originOther}
                  onChange={(e) => { setOriginOther(e.target.value); clearError("originOther"); }}
                  placeholder="Préciser..."
                  className={errors.originOther ? "border-destructive" : ""}
                />
                {fieldError("originOther")}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: RDV info ── */}
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Rendez-vous</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date *</Label>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); clearError("date"); }} className={errors.date ? "border-destructive" : ""} />
              {fieldError("date")}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Heure *</Label>
              <Input type="time" value={time} onChange={(e) => { setTime(e.target.value); clearError("time"); }} className={errors.time ? "border-destructive" : ""} />
              {fieldError("time")}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Représentant</Label>
              <Select value={repId} onValueChange={setRepId} disabled={role === "representant"}>
                <SelectTrigger>
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
        </div>

        {/* ── Section 3: Préqualification ── */}
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Préqualification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Q1 */}
            <div className="space-y-1">
              <Label className="text-xs">Qui sont les propriétaires ? *</Label>
              <Select value={preQual.q1_owners} onValueChange={(v) => updatePreQual("q1_owners", v)}>
                <SelectTrigger className={errors.q1_owners ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {OWNER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldError("q1_owners")}
            </div>
            {/* Q2 */}
            <div className="space-y-1">
              <Label className="text-xs">Ce travail a-t-il déjà été réalisé ? *</Label>
              <Select value={preQual.q2_work_done} onValueChange={(v) => updatePreQual("q2_work_done", v)}>
                <SelectTrigger className={errors.q2_work_done ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_DONE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldError("q2_work_done")}
            </div>
            {/* Q3 */}
            <div className="space-y-1">
              <Label className="text-xs">Secteur d'activité</Label>
              <Input
                value={preQual.q3_sector}
                onChange={(e) => updatePreQual("q3_sector", e.target.value)}
                placeholder="Ex: Construction, Santé, Bureau..."
              />
            </div>
            {/* Q4 */}
            <div className="space-y-1">
              <Label className="text-xs">Années propriétaire à cette adresse ? *</Label>
              <Select value={preQual.q4_years} onValueChange={(v) => updatePreQual("q4_years", v)}>
                <SelectTrigger className={errors.q4_years ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldError("q4_years")}
            </div>
            {/* Q5 */}
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Travaux récents ou futurs</Label>
              <Input
                value={preQual.q5_renovations}
                onChange={(e) => updatePreQual("q5_renovations", e.target.value)}
                placeholder="Ex: toiture 2024, fenêtres bientôt..."
              />
            </div>
            {/* Q6 */}
            <div className="space-y-1">
              <Label className="text-xs">Rapport d'inspection existant ? *</Label>
              <Select value={preQual.q6_inspection} onValueChange={(v) => updatePreQual("q6_inspection", v)}>
                <SelectTrigger className={errors.q6_inspection ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {INSPECTION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
              {fieldError("q6_inspection")}
            </div>
            {/* Q6A & Q6B — conditional */}
            {preQual.q6_inspection === "Oui" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Par qui a-t-il été fait ? *</Label>
                  <Input
                    value={preQual.q6a_inspector}
                    onChange={(e) => updatePreQual("q6a_inspector", e.target.value)}
                    placeholder="Nom de l'inspecteur"
                    className={errors.q6a_inspector ? "border-destructive" : ""}
                  />
                  {fieldError("q6a_inspector")}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Délais de décision ? *</Label>
                  <Select value={preQual.q6b_decision_delay} onValueChange={(v) => updatePreQual("q6b_decision_delay", v)}>
                    <SelectTrigger className={errors.q6b_decision_delay ? "border-destructive" : ""}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {DECISION_DELAY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {fieldError("q6b_decision_delay")}
                </div>
              </>
            )}
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
