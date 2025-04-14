import { Check, Copy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown, {
  type Options as ReactMarkdownOptions,
} from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/core/utils";

export function Markdown({
  className,
  children,
  style,
  enableCopy,
  ...props
}: ReactMarkdownOptions & {
  className?: string;
  enableCopy?: boolean;
  style?: React.CSSProperties;
}) {
  // Add debugging to see what content is being processed
  console.log('Markdown content:', children);
  
  return (
    <div
      className={cn(className, "markdown flex flex-col gap-4")}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeKatex, {
            strict: false, // Disable strict mode temporarily to see if error persists
            throwOnError: false // Don't throw on parsing errors
          }]
        ]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
        {...props}
      >
        {processKatexInMarkdown(children)}
      </ReactMarkdown>
      {enableCopy && typeof children === "string" && (
        <div className="flex">
          <CopyButton content={children} />
        </div>
      )}
    </div>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(content);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 1000);
            } catch (error) {
              console.error(error);
            }
          }}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}{" "}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Copy</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function processKatexInMarkdown(markdown?: string | null) {
  if (!markdown) return markdown;

  const markdownWithKatexSyntax = markdown
    .replace(/\\\\\[/g, "$$\n") // Replace '\\[' with '$$\n'
    .replace(/\\\\\]/g, "\n$$") // Replace '\\]' with '\n$$'
    .replace(/\\\\\(/g, "$$\n") // Replace '\\(' with '$$\n'
    .replace(/\\\\\)/g, "\n$$") // Replace '\\)' with '\n$$'
    .replace(/\\\[/g, "$$\n") // Replace '\[' with '$$\n'
    .replace(/\\\]/g, "\n$$") // Replace '\]' with '\n$$'
    .replace(/\\\(/g, "$$\n") // Replace '\(' with '$$\n'
    .replace(/\\\)/g, "\n$$") // Replace '\)' with '\n$$'
    .replace(/\$\$(.*?)%/g, "$$\n$1%\n$$"); // Ensure comments have newlines

  return markdownWithKatexSyntax;
}
