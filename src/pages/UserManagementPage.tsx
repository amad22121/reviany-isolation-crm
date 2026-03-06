import { useState, useEffect, useCallback } from "react";
import { useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { can } from "@/lib/permissions/can";
import { usersRepo, type TeamUser } from "@/lib/data/usersRepo";
import { toast } from "@/hooks/use-toast";
import {
  UserPlus,
  Shield,
  Users,
  UserCheck,
  X,
  Phone,
  Crown,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const formatPhone = (raw: string | null) => {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
};

const ROLE_LABELS: Record<string, string> = {
  proprietaire: "Propriétaire",
  gestionnaire: "Gestionnaire",
  representant: "Représentant",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  actif: "default",
  désactivé: "destructive",
  invité: "outline",
};

const UserManagementPage = () => {
  const { role, workspaceId } = useWorkspaceContext();
  const { user } = useAuthContext();

  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "representant" as "gestionnaire" | "representant",
  });

  const canManageUsers = can(role, "manage_users") || role === "gestionnaire";

  const loadUsers = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const data = await usersRepo.listTeamUsers(workspaceId);
    setUsers(data);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Redirect rep away — AFTER all hooks
  if (role === "representant") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInvite = async () => {
    if (!form.name.trim() || !form.email.trim() || !workspaceId) return;

    setActionLoading("invite");
    const { error, temp_password } = await usersRepo.inviteUser({
      email: form.email.trim(),
      display_name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      tenant_id: workspaceId ?? "default",
    });

    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    } else {
      setShowInviteModal(false);
      setCredentials({ email: form.email.trim(), password: temp_password || "" });
      setForm({ name: "", phone: "", email: "", role: "representant" });
      await loadUsers();
    }
    setActionLoading(null);
  };

  const handleToggleStatus = async (u: TeamUser) => {
    const newDisabled = !u.disabled_at;
    setActionLoading(u.user_id);
    const { error } = await usersRepo.updateUserStatus(u.user_id, newDisabled);

    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    } else {
      toast({
        title: newDisabled ? "Utilisateur désactivé" : "Utilisateur réactivé",
        description: `${u.display_name} a été ${newDisabled ? "désactivé" : "réactivé"}.`,
      });
      await loadUsers();
    }
    setActionLoading(null);
  };

  const canToggle = (targetUser: TeamUser): boolean => {
    if (targetUser.user_id === user?.id) return false;
    if (role === "proprietaire") return targetUser.role !== "proprietaire";
    if (role === "gestionnaire") return targetUser.role === "representant";
    return false;
  };

  const openInviteModal = (defaultRole: "gestionnaire" | "representant") => {
    setForm({ name: "", phone: "", email: "", role: defaultRole });
    setShowInviteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Gestion des utilisateurs</h1>
        </div>
        <div className="flex items-center gap-2">
          {role === "proprietaire" && (
            <button
              onClick={() => openInviteModal("gestionnaire")}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Users className="h-4 w-4" /> Ajouter un gestionnaire
            </button>
          )}
          <button
            onClick={() => openInviteModal("representant")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4" /> Ajouter un représentant
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              {canManageUsers && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">
                      Aucun membre dans l'équipe
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Invitez votre premier membre pour commencer.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const RoleIcon =
                  u.role === "proprietaire"
                    ? Crown
                    : u.role === "gestionnaire"
                    ? Users
                    : UserCheck;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {formatPhone(u.phone)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[u.status] ?? "outline"}>
                        {u.status === "actif" && "Actif"}
                        {u.status === "désactivé" && "Désactivé"}
                        {u.status === "invité" && "Invité"}
                      </Badge>
                    </TableCell>
                    {canManageUsers && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canToggle(u) && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={actionLoading === u.user_id}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                u.disabled_at
                                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                                  : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                              }`}
                            >
                              {actionLoading === u.user_id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : u.disabled_at ? (
                                <ToggleRight className="h-3 w-3" />
                              ) : (
                                <ToggleLeft className="h-3 w-3" />
                              )}
                              {u.disabled_at ? "Réactiver" : "Désactiver"}
                            </button>
                          )}
                          {u.status === "invité" && (
                            <button
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                            >
                              <RefreshCw className="h-3 w-3" /> Renvoyer
                            </button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Inviter un utilisateur</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nom complet <span className="text-destructive">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom complet"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(514) 123-4567"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rôle</label>
                {role === "gestionnaire" ? (
                  <div className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    Représentant (seul rôle disponible)
                  </div>
                ) : (
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as "gestionnaire" | "representant" })
                    }
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="representant">Représentant</option>
                    <option value="gestionnaire">Gestionnaire</option>
                  </select>
                )}
              </div>
              <button
                onClick={handleInvite}
                disabled={
                  !form.name.trim() ||
                  !form.email.trim() ||
                  actionLoading === "invite"
                }
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading === "invite" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Envoyer l'invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
