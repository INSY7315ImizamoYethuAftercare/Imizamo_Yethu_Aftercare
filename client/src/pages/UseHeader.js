import { useSession } from "../services/session";
import { useClasses } from "./UseClasses";

// The name and role line shown in every page header, from whoever is logged
// in. Teachers also show the class they lead ("Teacher • Yellow").
export function useHeader() {
  const { user } = useSession();
  const classes = useClasses();
  if (!user) return { displayName: "", displayRole: "" };

  const roleLabel = { manager: "Manager", admin: "Admin", guardian: "Parent", teacher: "Teacher" }[user.role] ?? user.role;
  let displayRole = roleLabel;
  if (user.role === "teacher") {
    const led = classes.find((c) => c.teacher === user.fullName);
    displayRole = `Teacher • ${led ? led.name : "No class yet"}`;
  }
  return { displayName: user.fullName, displayRole };
}
