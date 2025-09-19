import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainPage from "@/pages/MainPage";

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <MainPage />
    </QueryClientProvider>
  );
}
