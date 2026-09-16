import { useRef, useState } from "react";
import { Download, RotateCcw, Target, Upload, User } from "lucide-react";
import { Card } from "@/components/Card";
import { ConfirmSheet } from "@/components/Sheet";
import type { DailyGoals } from "@/lib/constants";
import { exportBackup, importBackup, storage } from "@/lib/storage";
import { useDiary } from "@/providers/DiaryProvider";
import { useProfile } from "@/providers/ProfileProvider";
import { useToast } from "@/providers/ToastProvider";

const GOAL_FIELDS = [
  { key: "calories", label: "Calories", suffix: "cal" },
  { key: "carbs", label: "Carbs", suffix: "g" },
  { key: "fat", label: "Fat", suffix: "g" },
  { key: "protein", label: "Protein", suffix: "g" },
] as const;

export function MoreScreen() {
  const toast = useToast();
  const { profile, goals, setName, setGoals, reload: reloadProfile } = useProfile();
  const { allEntries, reload } = useDiary();

  const [draftGoals, setDraftGoals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      GOAL_FIELDS.map((field) => [field.key, String(goals[field.key])]),
    ),
  );
  const [resetOpen, setResetOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveGoals = () => {
    const next = {} as DailyGoals;
    for (const field of GOAL_FIELDS) {
      const parsed = Number.parseFloat(draftGoals[field.key]);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error(`Enter a ${field.label.toLowerCase()} goal above 0`);
        return;
      }
      next[field.key] = Math.round(parsed);
    }
    setGoals(next);
    toast.success("Goals saved");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitness-diary-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      importBackup(await file.text());
      reload();
      reloadProfile();
      setDraftGoals(
        Object.fromEntries(
          GOAL_FIELDS.map((field) => [
            field.key,
            String(storage.loadProfile().goals[field.key]),
          ]),
        ),
      );
      toast.success("Backup restored");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleReset = () => {
    storage.clearAll();
    reload();
    reloadProfile();
    toast.success("All data cleared");
  };

  return (
    <div className="flex h-full flex-col pt-safe">
      <div className="shrink-0 px-6 pb-2 pt-2">
        <h1 className="text-2xl font-extrabold text-gray-900">More</h1>
      </div>

      <div className="scroll-area">
        <div className="flex flex-col gap-3 p-4 pb-10">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
              <User size={16} className="text-primary" />
              Your name
            </h2>
            <input
              value={profile.name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Add your name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-primary"
            />
          </Card>

          <Card>
            <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900">
              <Target size={16} className="text-primary" />
              Daily goals
            </h2>
            <p className="mb-3 text-sm text-gray-400">
              These drive every ring and bar in the app.
            </p>

            <div className="flex flex-col">
              {GOAL_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center justify-between border-b border-gray-100 py-2.5 last:border-b-0"
                >
                  <span className="text-base text-gray-800">{field.label}</span>
                  <span className="flex items-baseline gap-1">
                    <input
                      value={draftGoals[field.key]}
                      onChange={(event) =>
                        setDraftGoals((previous) => ({
                          ...previous,
                          [field.key]: event.target.value,
                        }))
                      }
                      inputMode="numeric"
                      className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-right font-bold text-primary outline-none focus:border-primary"
                    />
                    <span className="w-7 text-sm text-gray-400">
                      {field.suffix}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={saveGoals}
              className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-base font-bold text-white active:opacity-90"
            >
              Save goals
            </button>
          </Card>

          <Card>
            <h2 className="mb-1 text-base font-bold text-gray-900">Your data</h2>
            <p className="mb-3 text-sm text-gray-400">
              {allEntries.length} entries, stored only on this device. Export a
              backup before clearing your browser data or switching phones.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-base font-bold text-gray-900"
              >
                <Download size={16} />
                Export backup
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-base font-bold text-gray-900"
              >
                <Upload size={16} />
                Restore from backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleImport(file);
                  event.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-danger px-4 py-3 text-base font-bold text-danger"
              >
                <RotateCcw size={16} />
                Clear all data
              </button>
            </div>
          </Card>

          <p className="px-2 text-center text-xs text-gray-400">
            Food data from Open Food Facts, licensed under the Open Database
            License.
          </p>
        </div>
      </div>

      <ConfirmSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Clear all data?"
        message="Every logged entry, your goals and your name will be deleted from this device. This can't be undone."
        confirmLabel="Clear everything"
        destructive
        onConfirm={handleReset}
      />
    </div>
  );
}
