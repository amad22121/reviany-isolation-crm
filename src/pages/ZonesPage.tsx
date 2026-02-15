import { useMemo } from "react";
import { useCrm, useAuth } from "@/store/crm-store";
import { SALES_REPS, MANAGERS } from "@/data/crm-data";
import { Map, MapPin, User } from "lucide-react";

const ZonesPage = () => {
  const { zones, assignZone } = useCrm();
  const { role, currentManagerId } = useAuth();

  const visibleZones = useMemo(() => {
    if (role === "gestionnaire" && currentManagerId) {
      return zones.filter((z) => z.managerId === currentManagerId);
    }
    return zones;
  }, [zones, role, currentManagerId]);

  const canAssign = role === "proprietaire" || role === "gestionnaire";

  const getRepName = (repId?: string) =>
    repId ? SALES_REPS.find((r) => r.id === repId)?.name || "—" : "Non assigné";

  const getManagerName = (managerId: string) =>
    MANAGERS.find((m) => m.id === managerId)?.name || managerId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-foreground">Zones terrain</h1>
        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Démo conceptuelle</span>
      </div>

      {/* Conceptual map placeholder */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Map className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Carte des zones — Montréal</h2>
        </div>
        <div className="relative bg-secondary/50 rounded-lg overflow-hidden h-64 flex items-center justify-center border border-border">
          {/* Simulated zone blocks */}
          <div className="grid grid-cols-3 gap-3 p-4 w-full max-w-lg">
            {visibleZones.map((zone) => (
              <div
                key={zone.id}
                className="rounded-lg p-3 border border-border/50 text-center"
                style={{ backgroundColor: `${zone.color}20`, borderColor: zone.color }}
              >
                <MapPin className="h-4 w-4 mx-auto mb-1" style={{ color: zone.color }} />
                <div className="text-xs font-medium text-foreground">{zone.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {getRepName(zone.assignedRepId)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone details table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Zone", "Description", "Gestionnaire", "Représentant assigné", ...(canAssign ? ["Action"] : [])].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleZones.map((zone) => (
                <tr key={zone.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} />
                      <span className="font-medium text-foreground">{zone.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{zone.description}</td>
                  <td className="px-4 py-3 text-foreground text-xs">{getManagerName(zone.managerId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-foreground text-xs">
                      <User className="h-3 w-3" /> {getRepName(zone.assignedRepId)}
                    </div>
                  </td>
                  {canAssign && (
                    <td className="px-4 py-3">
                      <select
                        value={zone.assignedRepId || ""}
                        onChange={(e) => assignZone(zone.id, e.target.value)}
                        className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Non assigné</option>
                        {SALES_REPS.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ZonesPage;
