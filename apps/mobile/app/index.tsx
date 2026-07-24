import { Redirect } from "expo-router";
import { useAuth } from "../src/store";

export default function Index() {
  const user = useAuth((state) => state.user);
  if (!user) return <Redirect href="/auth" />;
  return <Redirect href={user.role === "customer" ? "/(customer)" : "/(pro)"} />;
}
