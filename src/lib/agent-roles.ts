export type RoleKey =
  | "best_friend"
  | "study_guide"
  | "father"
  | "mother"
  | "sister"
  | "mentor"
  | "custom";

export type Gender = "female" | "male" | "neutral";

export type RoleDef = {
  key: RoleKey;
  label: string;
  tagline: string;
  emoji: string;
  needsGender?: boolean;
};

export const ROLES: RoleDef[] = [
  {
    key: "best_friend",
    label: "Best Friend",
    tagline: "Your ride-or-die confidant 💛",
    emoji: "🐻",
    needsGender: true,
  },
  { key: "study_guide", label: "Study Guide", tagline: "Makes hard things simple 📚", emoji: "🦉" },
  { key: "father", label: "Father", tagline: "Grounded, practical wisdom 🌳", emoji: "🐻‍❄️" },
  { key: "mother", label: "Mother", tagline: "Soft place to land 🌷", emoji: "🐰" },
  { key: "sister", label: "Sister", tagline: "Loyal, candid, protective 🎀", emoji: "🦊" },
  { key: "mentor", label: "Mentor", tagline: "Long-game strategy 🧭", emoji: "🦄" },
  { key: "custom", label: "Custom", tagline: "Design your own companion ✨", emoji: "🌈" },
];

export const roleByKey = (key: string) => ROLES.find((r) => r.key === key) ?? ROLES[ROLES.length - 1]!;

export function emojiFor(role: string, gender?: string | null) {
  if (role === "best_friend") {
    if (gender === "female") return "🐣";
    if (gender === "male") return "🐶";
    return "🐻";
  }
  return roleByKey(role).emoji;
}

export function defaultName(role: string, gender?: string | null) {
  if (role === "best_friend") {
    if (gender === "female") return "Best Friend (she)";
    if (gender === "male") return "Best Friend (he)";
  }
  return roleByKey(role).label;
}

export const EMOJI_CHOICES = [
  "🐻",
  "🐰",
  "🦊",
  "🐣",
  "🐶",
  "🐱",
  "🦉",
  "🦄",
  "🐨",
  "🐼",
  "🌈",
  "🌻",
];
