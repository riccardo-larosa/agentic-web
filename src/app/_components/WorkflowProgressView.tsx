import { Minimize2, Maximize2 } from "lucide-react";
import { parse } from "best-effort-json-parser";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Options as ReactMarkdownOptions } from "react-markdown";

import { useAutoScrollToBottom } from "~/components/hooks/useAutoScrollToBottom";
import { useOnStateChangeEffect } from "~/components/hooks/useOnStateChangeEffect";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Atom } from "~/core/icons";
import { cn } from "~/core/utils";
import {
  type ThinkingTask,
  type Workflow,
  type WorkflowStep,
} from "~/core/workflow";

import { Markdown } from "./Markdown";
import { ToolCallView } from "./ToolCallView";

// Create a custom markdown component without math processing
function WorkflowMarkdown({
  className,
  children,
  ...props
}: ReactMarkdownOptions & {
  className?: string;
  children: string;
}) {
  return (
    <Markdown
      remarkPlugins={[]} // Remove all remark plugins
      rehypePlugins={[]} // Remove all rehype plugins
      className={className}
      {...props}
    >
      {children}
    </Markdown>
  );
}

export function WorkflowProgressView({
  className,
  workflow,
}: {
  className?: string;
  workflow: Workflow;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [blockWidth, setBlockWidth] = useState(800);
  const [blockHeight, setBlockHeight] = useState(400);

  const steps = useMemo(() => {
    return workflow.steps.filter((step) => step.agentName !== "reporter");
  }, [workflow]);
  const reportStep = useMemo(() => {
    return workflow.steps.find((step) => step.agentName === "reporter");
  }, [workflow]);

  useAutoScrollToBottom(mainRef, !workflow.isCompleted);

  useEffect(() => {
    if (isExpanded) {
      setBlockWidth(1200);
      setBlockHeight(window.innerHeight - 320);
      if (blockRef.current) {
        blockRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } else {
      setBlockWidth(800);
      setBlockHeight(400);
    }
  }, [isExpanded]);

  return (
    <div className="relative flex flex-col gap-4">
      <div
        ref={blockRef}
        className={cn(
          `flex overflow-hidden rounded-2xl border transition-all duration-300`,
          className,
          isExpanded && "translate-x-[-136px]",
        )}
        style={{
          width: blockWidth,
          height: blockHeight,
        }}
      >
        <aside className="relative flex w-[150px] shrink-0 flex-col border-r bg-[rgba(0,0,0,0.02)] text-sm">
          <div className="shrink-0 px-4 py-4 font-medium">Flow</div>
          <ol className="flex grow list-disc flex-col gap-4 px-4 py-2">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex cursor-pointer items-center gap-2"
                onClick={() => {
                  const element = document.getElementById(step.id);
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              >
                <div className="flex h-2 w-2 rounded-full bg-gray-400"></div>
                <div>{getStepName(step)}</div>
              </li>
            ))}
          </ol>
          <div className="absolute bottom-2 left-4">
            <Tooltip>
              <TooltipTrigger asChild>
                {isExpanded ? (
                  <Minimize2 onClick={() => setIsExpanded(false)} />
                ) : (
                  <Maximize2 onClick={() => setIsExpanded(true)} />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{isExpanded ? "Collapse" : "Expand"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>
        <main className="grow overflow-auto bg-white p-4" ref={mainRef}>
          <ul className="flex flex-col gap-4">
            {steps.map((step, stepIndex) => (
              <li key={step.id} className="flex flex-col gap-2">
                <h3 id={step.id} className="ml-[-4px] text-lg font-bold">
                  📍 Step {stepIndex + 1}: {getStepName(step)}
                </h3>
                <ul className="flex flex-col gap-2">
                  {step.tasks
                    .filter(
                      (task) =>
                        !(
                          task.type === "thinking" &&
                          !task.payload.text &&
                          !task.payload.reason
                        ),
                    )
                    .map((task) =>
                      task.type === "thinking" &&
                      step.agentName === "planner" ? (
                        <PlanTaskView key={task.id} task={task} />
                      ) : (
                        <li key={task.id} className="flex">
                          {task.type === "thinking" ? (
                            <Markdown
                              className="pl-6 opacity-70"
                              style={{
                                fontSize: "smaller",
                              }}
                            >
                              {task.payload.text}
                            </Markdown>
                          ) : (
                            <ToolCallView task={task} />
                          )}
                        </li>
                      ),
                    )}
                </ul>
                {stepIndex < steps.length - 1 && <hr className="mt-8 mb-4" />}
              </li>
            ))}
          </ul>
        </main>
      </div>
      {reportStep && (
        <div className="flex flex-col gap-4 p-4">
          <Markdown enableCopy={workflow.isCompleted}>
            {reportStep.tasks[0]?.type === "thinking"
              ? reportStep.tasks[0].payload.text
              : ""}
          </Markdown>
        </div>
      )}
    </div>
  );
}

function PlanTaskView({ task }: { task: ThinkingTask }) {
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);

  const plan = useMemo<{
    title?: string;
    steps?: { title?: string; description?: string }[];
  }>(() => {
    if (task.state !== "success" || !task.payload.text) {
      return {};
    }

    let jsonString = task.payload.text.trim();
    
    // Only attempt to parse if we have a complete code block
    if (jsonString.includes("```") && jsonString.split("```").length >= 3) {
      try {
        const blocks = jsonString.split("```");
        const codeBlock = blocks[1]?.trim() || "";
        let content = codeBlock;
        
        // Remove language identifier if present
        const firstLineBreak = content.indexOf('\n');
        if (firstLineBreak !== -1) {
          const language = content.substring(0, firstLineBreak).toLowerCase();
          content = content.substring(firstLineBreak + 1).trim();
        }

        try {
          const parsed = parse(content);
          return typeof parsed === "object" ? parsed : {};
        } catch {
          console.log("Failed to parse content:", content);
          return {};
        }
      } catch {
        return {};
      }
    }
    return {};
  }, [task]);

  // Debug the markdown content being generated
  const reason = task.payload.reason;
  const markdown = useMemo(() => {
    const content = `## ${plan.title ?? ""}\n\n${plan.steps?.map((step) => `- **${step.title ?? ""}**\n\n${step.description ?? ""}`).join("\n\n") ?? ""}`;
    console.log('Generated markdown:', content);
    console.log('Reason content:', reason);
    return content;
  }, [plan, reason]);

  useOnStateChangeEffect(
    task.state,
    {
      from: "pending",
      to: "success",
    },
    () => {
      setIsThinkingCollapsed(true);
    },
  );

  return (
    <li key={task.id} className="flex flex-col">
      {reason && (
        <Accordion
          type="single"
          collapsible
          className="mb-2"
          value={isThinkingCollapsed ? "" : "deep-thought"}
          onValueChange={(value) => {
            setIsThinkingCollapsed(value === "");
          }}
        >
          <AccordionItem value="deep-thought" className="border-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <AccordionTrigger className="flex w-fit flex-none items-center gap-2 rounded-2xl border px-3 py-1 text-sm hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <Atom className="h-4 w-4" />
                  <span>Deep Thought</span>
                </AccordionTrigger>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{isThinkingCollapsed ? "Show thought" : "Hide thought"}</p>
              </TooltipContent>
            </Tooltip>
            <AccordionContent>
              <WorkflowMarkdown className="border-l-2 pt-2 pl-6 text-sm opacity-70">
                {reason}
              </WorkflowMarkdown>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <div>
        <WorkflowMarkdown className="pl-6">{markdown}</WorkflowMarkdown>
      </div>
    </li>
  );
}

function getStepName(step: WorkflowStep) {
  switch (step.agentName) {
    case "browser":
      return "Browsing Web";
    case "coder":
      return "Coding";
    case "file_manager":
      return "Managing Files";
    case "planner":
      return "Planning";
    case "researcher":
      return "Researching";
    case "supervisor":
      return "Thinking";
    default:
      return step.agentName;
  }
}
