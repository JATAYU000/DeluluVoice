import { useState } from "react";

const API = "https://deluluvoice.onrender.com";

export default function UploadSongs() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const uploadSong = async () => {
    if (!file) {
      setMessage("Please select a song");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("name", name || file.name);
      formData.append(
        "color",
        "linear-gradient(to bottom right, #8b5cf6, #d946ef)",
      );
      formData.append("isPublic", String(isPublic));

      const response = await fetch(`${API}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      console.log(data);

      setMessage("Song uploaded successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 space-y-4 border border-zinc-700">
        <h1 className="text-3xl font-bold">Upload Local Song</h1>

        <input
          type="text"
          placeholder="Song Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
        />

        <input
          type="file"
          accept="audio/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
            }
          }}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public Song
        </label>

        <button
          onClick={uploadSong}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded-lg font-semibold"
        >
          {loading ? "Uploading..." : "Upload Song"}
        </button>

        {message && <p className="text-sm text-zinc-300">{message}</p>}
      </div>
    </div>
  );
}
