"use client";

import { nanoid } from "nanoid";
import { useCallback, useRef } from "react";

import { useAutoScrollToBottom } from "~/components/hooks/useAutoScrollToBottom";
import { ScrollArea } from "~/components/ui/scroll-area";
import { TooltipProvider } from "~/components/ui/tooltip";
import { sendMessage, useInitTeamMembers, useStore } from "~/core/store";
import { cn } from "~/core/utils";

import { AppHeader } from "./_components/AppHeader";
import { InputBox } from "./_components/InputBox";
import { MessageHistoryView } from "./_components/MessageHistoryView";

export default function HomePage() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = useStore((state) => state.messages);
  const responding = useStore((state) => state.responding);

  const handleSendMessage = useCallback(
    async (
      content: string,
      config: { deepThinkingMode: boolean; searchBeforePlanning: boolean },
    ) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      await sendMessage(
        {
          id: nanoid(),
          role: "user",
          type: "text",
          content,
        },
        config,
        { abortSignal: abortController.signal },
      );
      abortControllerRef.current = null;
    },
    [],
  );

  useInitTeamMembers();
  useAutoScrollToBottom(scrollAreaRef, responding);

  return (
    <TooltipProvider delayDuration={150}>
      <ScrollArea 
        className="min-h-screen w-full" 
        ref={scrollAreaRef}
        type="auto"
      >
        <div className="flex min-h-screen flex-col items-center">
          <header className="sticky top-0 right-0 left-0 z-10 flex h-16 w-full items-center px-4 backdrop-blur-sm">
            <AppHeader />
          </header>
          <main className="w-full flex-1 px-4 pb-48">
            <MessageHistoryView
              className="mx-auto w-full max-w-[800px]"
              messages={messages}
              loading={responding}
            />
          </main>
          <footer
            className={cn(
              "fixed bottom-4 mx-auto w-full px-4 transition-transform duration-500 ease-in-out",
              messages.length === 0
                ? "max-w-[640px] translate-y-[-34vh]"
                : "max-w-[800px]",
            )}
          >
            {messages.length === 0 && (
              <div className="flex w-full flex-col px-4 md:w-[640px] md:translate-y-[-32px]">
                <h3 className="mb-2 text-center text-2xl font-medium md:text-3xl">
                  👋 Hello, there!
                </h3>
                <div className="px-2 text-center text-base text-gray-400 md:text-lg">
                  Try one of these topics:
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      onClick={() => handleSendMessage(
                        "analyze Google stock performance in the last 4 quarters",
                        { deepThinkingMode: true, searchBeforePlanning: true }
                      )}
                      className="mx-auto rounded-xl border bg-white px-6 py-3 text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      📈 Analyze Google stock performance
                    </button>
                    <button
                      onClick={() => handleSendMessage(
                        "find homes for sales in Cambridge MA with at least 2 bedrooms",
                        { deepThinkingMode: false, searchBeforePlanning: true }
                      )}
                      className="mx-auto rounded-xl border bg-white px-6 py-3 text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                    >
                      🏠 Find homes in Cambridge, MA
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col overflow-hidden rounded-[24px] border bg-white shadow-lg">
              <InputBox
                size={messages.length === 0 ? "large" : "normal"}
                responding={responding}
                onSend={handleSendMessage}
                onCancel={() => {
                  abortControllerRef.current?.abort();
                  abortControllerRef.current = null;
                }}
              />
            </div>
            <div className="absolute bottom-[-32px] h-8 w-full backdrop-blur-xs" />
          </footer>
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}
