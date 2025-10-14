import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainPage from "@/pages/MainPage";
import LoginPage from "@/pages/LoginPage";
import { useAuthStore } from "@/store/authStore";
import { useEventStore } from "@/store/eventStore";

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const agent = useAuthStore((state) => state.agent);
  const resetEvent = useEventStore((state) => state.setActiveEvent);

  useEffect(() => {
    if (!agent) {
      queryClient.clear();
      resetEvent(undefined);
    }
  }, [agent, queryClient, resetEvent]);

  return (
    <QueryClientProvider client={queryClient}>
      {agent ? <MainPage /> : <LoginPage />}
    </QueryClientProvider>
  );
}
