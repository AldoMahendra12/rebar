"use client";

import { useState } from "react";
import {
  UserPlus, MoreHorizontal, ShieldAlert, ShieldCheck,
  X, Mail, ChevronDown, Check, Loader2, UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

type Role = "Owner / Admin" | "Project Manager" | "Admin Proyek" | "Viewer";

interface Member {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Invited";
}

const INITIAL_MEMBERS: Member[] = [
  { id: 1, name: "Budi Santoso", email: "budi@rebarconstruct.co.id", role: "Owner / Admin", status: "Active" },
  { id: 2, name: "Andi Saputra", email: "andi.pm@rebarconstruct.co.id", role: "Project Manager", status: "Active" },
  { id: 3, name: "Siti Aminah", email: "siti.admin@rebarconstruct.co.id", role: "Admin Proyek", status: "Invited" },
];

const ROLES: Role[] = ["Owner / Admin", "Project Manager", "Admin Proyek", "Viewer"];

function RoleBadgeIcon({ role }: { role: string }) {
  if (role.includes("Owner") || role.includes("Admin")) {
    return <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />;
  }
  return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />;
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: Role) => void;
}

function InviteModal({ open, onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Project Manager");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    onInvite(email.trim(), role);
    setSent(true);
    setLoading(false);
    setTimeout(() => {
      setSent(false);
      setEmail("");
      setRole("Project Manager");
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Undang Anggota Baru
          </DialogTitle>
          <DialogDescription>
            Masukkan email dan pilih peran untuk anggota yang diundang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Alamat Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="nama@perusahaan.co.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Peran (Role)</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    role === r
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-zinc-300 hover:text-foreground"
                  }`}
                >
                  <RoleBadgeIcon role={r} />
                  <span className="truncate">{r}</span>
                  {role === r && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!email || loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</>
            ) : sent ? (
              <><Check className="w-4 h-4 mr-2" />Terkirim!</>
            ) : (
              <><Mail className="w-4 h-4 mr-2" />Kirim Undangan</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Role Dialog ────────────────────────────────────────────────────────

interface ChangeRoleDialogProps {
  open: boolean;
  member: Member | null;
  onClose: () => void;
  onSave: (memberId: number, newRole: Role) => void;
}

function ChangeRoleDialog({ open, member, onClose, onSave }: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(member?.role ?? "Viewer");

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubah Peran Anggota</DialogTitle>
          <DialogDescription>
            Mengubah peran <strong>{member.name}</strong> dalam organisasi ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm transition-all ${
                selectedRole === r
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-zinc-300"
              }`}
            >
              <RoleBadgeIcon role={r} />
              {r}
              {selectedRole === r && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => { onSave(member.id, selectedRole); onClose(); }}>
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = useState<Member | null>(null);

  const handleInvite = (email: string, role: Role) => {
    const newMember: Member = {
      id: Date.now(),
      name: email.split("@")[0],
      email,
      role,
      status: "Invited",
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const handleChangeRole = (memberId: number, newRole: Role) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const handleRemove = (memberId: number) => {
    if (!confirm("Yakin ingin menghapus anggota ini dari tim?")) return;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Anggota Tim</CardTitle>
            <CardDescription>
              Kelola akses tim ke proyek-proyek dalam organisasi Anda.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Undang Anggota
          </Button>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="font-medium p-3">Nama Lengkap</th>
                  <th className="font-medium p-3">Peran (Role)</th>
                  <th className="font-medium p-3">Status</th>
                  <th className="font-medium p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {members.map((member) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-3">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <RoleBadgeIcon role={member.role} />
                          {member.role}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={member.status === "Active" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => setChangeRoleTarget(member)}
                              className="cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5 mr-2" />
                              Ubah Peran
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemove(member.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <UserMinus className="w-3.5 h-3.5 mr-2" />
                              Hapus dari Tim
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
      <ChangeRoleDialog
        open={!!changeRoleTarget}
        member={changeRoleTarget}
        onClose={() => setChangeRoleTarget(null)}
        onSave={handleChangeRole}
      />
    </>
  );
}
