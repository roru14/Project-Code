import { useState } from "react";
import { useProfile } from "@/providers/ProfileProvider";

export function OnboardingScreen() {
  const { completeOnboarding } = useProfile();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    completeOnboarding(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col justify-between bg-white px-6 pb-8 pt-safe"
    >
      <div className="pt-16">
        <h1 className="text-3xl font-extrabold text-gray-900">
          What should we call you?
        </h1>
        <p className="mt-2 text-base text-gray-400">
          Everything you log stays on this device.
        </p>

        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder="Your name"
          autoFocus
          autoComplete="given-name"
          className="mt-8 w-full border-b-2 border-gray-200 pb-3 text-2xl outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-primary px-4 py-4 text-lg font-bold text-white active:opacity-90"
      >
        Continue
      </button>
    </form>
  );
}
