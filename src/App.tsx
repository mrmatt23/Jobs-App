import { Dashboard } from "./components/Dashboard";
import { useJobSite } from "./useJobSite";

export default function App() {
  const api = useJobSite();
  return <Dashboard api={api} />;
}
