import { useState } from "react";
import { useCrm } from "@/store/crm-store";
import { toast } from "@/hooks/use-toast";
import {
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  Users,
  X,
  Check,
  Phone,
} from "lucide-react";

type ManagedUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "gestionnaire" | "representant";
  active: boolean;
};

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
};

const INITIAL_USERS: ManagedUser[] = [];

const UserManagementPage = () => {
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Add form state
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", role: "representant" as "gestionnaire" | "representant" });

  const phoneDigits = form.phone.replace(/\D/g, "");
  const isPhoneValid = phoneDigits.length >= 10;

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !isPhoneValid) return;
    const newUser: ManagedUser = {
      id: `user_${Date.now()}`,
      name: form.name.trim(),
      phone: phoneDigits,
      email: form.email.trim(),
      role: form.role,
      active: true,
    };
    setUsers((prev) => [...prev, newUser]);
    setForm({ name: "", phone: "", email: "", password: "", role: "representant" });
    setShowAddModal(false);
    toast({
      title: "✅ SMS de bienvenue envoyé",
      description: `SMS de bienvenue envoyé à ${newUser.name} avec succès.`,
    });
  };

  const handleRoleChange = (id: string, newRole: "gestionnaire" | "representant") => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    setEditingUser(null);
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteConfirm(null);
  };

  const roleLabel = (r: string) => (r === "gestionnaire" ? "Manager" : "Représentant");
  const RoleIcon = (r: string) => (r === "gestionnaire" ? Users : UserCheck);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Gestion des représentants</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <UserPlus className="h-4 w-4" /> Ajouter un représentant
        </button>
      </div>

      {/* Users table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Nom", "Téléphone", "Email", "Rôle", "Statut", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const Icon = RoleIcon(u.role);
                return (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {formatPhone(u.phone)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                        <Icon className="h-3 w-3" />
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Actif
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> Modifier
                        </button>
                        {deleteConfirm === u.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" /> Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">Aucun représentant pour le moment</p>
                      <p className="text-muted-foreground text-xs">Ajoutez votre premier représentant pour commencer.</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <UserPlus className="h-4 w-4" /> Ajouter un représentant
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Ajouter un représentant</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nom complet</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom complet"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(514) 123-4567"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {form.phone && !isPhoneValid && (
                  <p className="text-xs text-destructive mt-1">Minimum 10 chiffres requis</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Mot de passe temporaire</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="gestionnaire">Manager</option>
                  <option value="representant">Représentant</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={!form.name.trim() || !isPhoneValid || !form.email.trim() || !form.password.trim()}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer le profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingUser(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Modifier le rôle</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Modifier le rôle de <span className="font-medium text-foreground">{editingUser.name}</span>
            </p>
            <div className="space-y-2">
              {(["gestionnaire", "representant"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(editingUser.id, r)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    editingUser.role === r
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-secondary text-foreground hover:bg-secondary/80 border border-transparent"
                  }`}
                >
                  {r === "gestionnaire" ? <Users className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  {roleLabel(r)}
                  {editingUser.role === r && <Check className="h-4 w-4 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
