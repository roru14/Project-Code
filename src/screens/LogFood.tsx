import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Mic,
  Plus,
  PlusCircle,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ActionSheet } from "@/components/Sheet";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { MEALS, MEAL_LABELS, colors, isMeal, type Meal } from "@/lib/constants";
import { searchProducts, type FoodItem } from "@/lib/openfoodfacts";
import { setPendingItem } from "@/lib/pendingItem";
import { useDiary } from "@/providers/DiaryProvider";
import { useToast } from "@/providers/ToastProvider";

const SEARCH_TABS = ["All", "My Meals", "My Recipes", "My Foods"] as const;
type SearchTab = (typeof SEARCH_TABS)[number];

interface QuickAction {
  key: string;
  label: string;
  Icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: "barcode", label: "Barcode scan", Icon: ScanLine },
  { key: "voice", label: "Voice log", Icon: Mic },
  { key: "meal-scan", label: "Meal scan", Icon: Camera },
  { key: "quick-add", label: "Quick add", Icon: PlusCircle },
];

function FoodRow({
  item,
  added,
  onOpen,
  onQuickAdd,
}: {
  item: FoodItem;
  added: boolean;
  onOpen: () => void;
  onQuickAdd: () => void;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3">
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="truncate text-base font-bold text-gray-900">
            {item.name}
          </span>
          {item.verified && (
            <CheckCircle2 size={14} className="shrink-0 text-carbs" />
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm text-gray-400">
          {Math.round(item.caloriesPerServing)} cal, {item.servingLabel}
          {item.brand ? ` · ${item.brand}` : ""}
        </span>
      </button>
      <button
        type="button"
        onClick={onQuickAdd}
        aria-label={`Add ${item.name}`}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          added ? "bg-carbs text-white" : "bg-gray-100 text-primary"
        }`}
      >
        {added ? <Check size={18} /> : <Plus size={18} />}
      </button>
    </div>
  );
}

export function LogFoodScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { addEntry, history } = useDiary();

  const mealParam = searchParams.get("meal");
  const [meal, setMeal] = useState<Meal>(
    isMeal(mealParam) ? mealParam : "breakfast",
  );
  const [mealPickerOpen, setMealPickerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("All");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearching(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setFailed(false);

    const timer = setTimeout(async () => {
      try {
        const items = await searchProducts(trimmed, {
          signal: controller.signal,
        });
        setResults(items);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setResults([]);
        setFailed(true);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const openItem = (item: FoodItem) => {
    setPendingItem(item);
    navigate(`/edit-entry?meal=${meal}`, { state: { item } });
  };

  const quickAdd = (item: FoodItem) => {
    try {
      addEntry({
        name: item.name,
        brand: item.brand,
        barcode: item.barcode,
        meal,
        servingLabel: item.servingLabel,
        numberOfServings: 1,
        caloriesPerServing: item.caloriesPerServing,
        carbsPerServing: item.carbsPerServing,
        fatPerServing: item.fatPerServing,
        proteinPerServing: item.proteinPerServing,
        fiberPerServing: item.fiberPerServing,
        sugarsPerServing: item.sugarsPerServing,
        saturatedFatPerServing: item.saturatedFatPerServing,
        sodiumMgPerServing: item.sodiumMgPerServing,
      });
      setAddedIds((previous) => new Set(previous).add(item.id));
      toast.success("Food logged!");
    } catch {
      toast.error("Could not log food");
    }
  };

  const handleQuickAction = (key: string) => {
    if (key === "barcode") {
      navigate(`/barcode-scan?meal=${meal}`);
    } else if (key === "quick-add") {
      setQuickAddOpen(true);
    } else {
      toast.error("Not available in this version");
    }
  };

  const historyItems = useMemo<FoodItem[]>(
    () =>
      history.map((item, index) => ({
        id: item.barcode ?? `${item.name}-${index}`,
        barcode: item.barcode ?? undefined,
        name: item.name,
        brand: item.brand ?? undefined,
        verified: !!item.barcode,
        servingLabel: item.servingLabel,
        caloriesPerServing: item.caloriesPerServing,
        carbsPerServing: item.carbsPerServing,
        fatPerServing: item.fatPerServing,
        proteinPerServing: item.proteinPerServing,
      })),
    [history],
  );

  const isSearchMode = query.trim().length > 0;
  const showsHistory = !isSearchMode && (activeTab === "All" || activeTab === "My Foods");
  const listData = isSearchMode ? results : showsHistory ? historyItems : [];

  return (
    <div className="flex h-full flex-col pt-safe">
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="p-1 text-gray-900"
        >
          <X size={24} />
        </button>
        <button
          type="button"
          onClick={() => setMealPickerOpen(true)}
          className="flex items-center gap-1 text-base font-bold text-primary"
        >
          {MEAL_LABELS[meal]}
          <ChevronDown size={16} />
        </button>
        <span className="w-6" />
      </div>

      <div className="mt-1 shrink-0 px-4">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5">
          <Search size={18} className="shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Food"
            enterKeyHint="search"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="shrink-0 text-gray-400"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {!isSearchMode && (
        <>
          <div className="mt-4 flex shrink-0 gap-5 px-4">
            {SEARCH_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm ${
                  activeTab === tab
                    ? "border-b-2 border-gray-900 font-bold text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4 flex shrink-0 gap-2.5 px-4">
            {QUICK_ACTIONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleQuickAction(key)}
                className="flex flex-1 flex-col items-center rounded-2xl border border-gray-200 py-3"
              >
                <Icon size={18} color={colors.primary} />
                <span className="mt-1 text-center text-xs font-bold leading-tight text-primary">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="scroll-area px-4 pb-10 pt-4">
        <h2 className="mb-2 text-lg font-extrabold text-gray-900">
          {isSearchMode ? "Search Results" : activeTab === "All" ? "History" : activeTab}
        </h2>

        {listData.map((item) => (
          <FoodRow
            key={item.id}
            item={item}
            added={addedIds.has(item.id)}
            onOpen={() => openItem(item)}
            onQuickAdd={() => quickAdd(item)}
          />
        ))}

        {listData.length === 0 && (
          <p className="py-10 text-center text-gray-400">
            {searching
              ? "Searching…"
              : failed
                ? "Search failed. Check your connection and try again."
                : isSearchMode
                  ? "No results found."
                  : showsHistory
                    ? "Foods you log will show up here."
                    : "Not available in this version."}
          </p>
        )}
      </div>

      <ActionSheet
        open={mealPickerOpen}
        onClose={() => setMealPickerOpen(false)}
        title="Select a Meal"
        options={MEALS.map((option) => ({
          label: MEAL_LABELS[option],
          selected: option === meal,
          onSelect: () => setMeal(option),
        }))}
      />

      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        meal={meal}
        onAdd={quickAdd}
      />
    </div>
  );
}
