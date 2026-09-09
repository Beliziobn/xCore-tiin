import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { useState } from "react";

export function AIInputWithLoadingDemo() {
  const [messages, setMessages] = useState<string[]>([]);

  const simulateResponse = async (message: string) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="space-y-8 min-w-[350px]">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
              {msg}
            </div>
          ))}
          <AIInputWithLoading 
            onSubmit={simulateResponse}
            loadingDuration={3000}
            placeholder="Type a message..."
          />
        </div>
    </div>
  );
}
