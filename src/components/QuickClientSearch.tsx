import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Phone, User, Calendar, Flame } from "lucide-react";
import { useCrm } from "@/store/crm-store";
import { SALES_REPS } from "@/data/crm-data";
import { useNavigate } from "react-router-dom";

interface ClientResult {
  id: string;
  type: "appointment" | "hotcall";
  fullName: string;
  phone: string;
  address: string;
  city: string;
  status: string;
  nextDate?: string;
  nextTime?: string;
  repId: string;
}

const QuickClientSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { appointments, hotCalls } = useCrm();

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const allClients = useMemo<ClientResult[]>(() => {
    const fromAppts: ClientResult[] = appointments.map((a) => ({
      id: a.id,
      type: "appointment",
      fullName: a.fullName,
      phone: a.phone,
      address: a.address,
      city: a.city || "",
      status: a.status,
      nextDate: a.date,
      nextTime: a.time,
      repId: a.repId,
    }));
    const fromHC: ClientResult[] = hotCalls.map((h) => ({
      id: h.id,
      type: "hotcall",
      fullName: h.fullName,
      phone: h.phone,
      address: h.address,
      city: h.city || "",
      status: h.status,
      nextDate: h.followUpDate,
      repId: h.repId,
    }));
    return [...fromAppts, ...fromHC];
  }, [appointments, hotCalls]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().replace(/[()-\s]/g, "");
    const digits = q.replace(/\D/g, "");
    const isPhoneSearch = digits.length >= 6;

    const scored = allClients
      .map((c) => {
        const phoneNorm = c.phone.replace(/\D/g, "");
        const nameMatch = c.fullName.toLowerCase().includes(q);
        const addressMatch = c.address.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
        const phoneMatch = phoneNorm.includes(digits) && digits.length > 0;

        let score = 0;
        if (isPhoneSearch) {
          if (phoneMatch) score = 100;
          else if (nameMatch) score = 10;
          else if (addressMatch) score = 5;
        } else {
          if (nameMatch) score = 100;
          if (phoneMatch) score += 50;
          if (addressMatch) score += 20;
        }
        return { ...c, score };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    return scored;
  }, [query, allClients]);

  const handleOpen = () => {
    setQuery("");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handleOpenProfile = (client: ClientResult) => {
    handleClose();
    if (client.type === "appointment") {
      navigate("/appointments");
    } else {
      navigate("/hot-calls");
    }
  };

  const getRepName = (repId: string) =>
    SALES_REPS.find((r) => r.id === repId)?.name || repId;

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all md:h-12 md:w-12"
        aria-label="Recherche rapide client"
      >
        <Search className="h-6 w-6 md:h-5 md:w-5" />
      </button>

      {/* Fullscreen overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, téléphone ou adresse..."
              className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none"
              autoComplete="off"
              inputMode="search"
            />
            <button
              onClick={handleClose}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto p-2">
            {query.trim() === "" && (
              <p className="text-center text-muted-foreground text-sm mt-12">
                Tapez un nom, numéro de téléphone ou adresse
              </p>
            )}

            {query.trim() !== "" && results.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-12">
                Aucun résultat trouvé
              </p>
            )}

            {results.map((client) => (
              <div
                key={`${client.type}-${client.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer"
                onClick={() => handleOpenProfile(client)}
              >
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  {client.type === "hotcall" ? (
                    <Flame className="h-4 w-4 text-warning" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {client.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {client.phone} · {client.city || client.address}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {client.status}
                    </span>
                    {client.nextDate && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {client.nextDate}
                        {client.nextTime && ` ${client.nextTime}`}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {getRepName(client.repId)}
                    </span>
                  </div>
                </div>
                <a
                  href={`tel:${client.phone.replace(/\D/g, "")}`}
                  onClick={(e) => e.stopPropagation()}
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 hover:bg-primary/20 transition-colors"
                  aria-label={`Appeler ${client.fullName}`}
                >
                  <Phone className="h-4 w-4 text-primary" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default QuickClientSearch;
