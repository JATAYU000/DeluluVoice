import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, Trash2, Camera, Save, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  onLogout,
  onAccountDeleted,
}: ProfileModalProps) {
  const { user, updateProfile, deleteAccount, logout } = useAuth();
  const [editName, setEditName] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const err = await updateProfile(
      editName !== user.name ? editName : undefined,
      avatarFile || undefined
    );
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const err = await deleteAccount();
    setDeleting(false);
    if (err) {
      setError(err);
    } else {
      onAccountDeleted();
    }
  };

  const avatarSrc = avatarPreview || user.avatar_url;
  const hasChanges = editName !== user.name || avatarFile !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-24 h-24 rounded-full overflow-hidden mb-4 ring-2 ring-orange-500/30 hover:ring-orange-500 transition-all"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <span className="text-2xl font-black text-white">
                      {initials}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-white/40 text-xs font-mono tracking-widest uppercase">
                Click to change photo
              </p>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-xs font-mono text-white/50 mb-1.5 uppercase tracking-widest">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
            </div>

            {/* Email (read-only) */}
            <div className="mb-6">
              <label className="block text-xs font-mono text-white/50 mb-1.5 uppercase tracking-widest">
                Email
              </label>
              <div className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-white/40 font-mono text-sm">
                {user.email}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-mono">
                {error}
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-white/10 disabled:text-white/30 text-black font-black font-display tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {/* Divider */}
            <div className="border-t border-white/5 my-4" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-sm tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 mb-3"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>

            {/* Delete Account */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 bg-transparent hover:bg-red-500/10 text-red-500/60 hover:text-red-400 font-mono text-xs tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 overflow-hidden"
              >
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-300 font-semibold mb-1">
                      Are you sure?
                    </p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Your <strong className="text-red-400">private tracks</strong>{" "}
                      will be permanently deleted. Public tracks will remain in the
                      public records.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white/70 font-mono text-xs tracking-widest uppercase rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs tracking-widest uppercase rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    {deleting ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    {deleting ? "Deleting..." : "Delete Forever"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
