import ReactMarkdown from "react-markdown";

import Link from "next/link";

import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type Heading = { id: string; text: string; level: 2 | 3 };

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inCode = false;

  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const match = /^(##|###)\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = match[2].replace(/[*_`~]/g, "").trim();
    headings.push({
      id: slugifyHeading(text),
      text,
      level: match[1].length === 2 ? 2 : 3,
    });
  }

  return headings;
}

function headingText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(headingText).join("");
  }
  if (
    children &&
    typeof children === "object" &&
    "props" in children &&
    children.props &&
    typeof children.props === "object" &&
    "children" in children.props
  ) {
    return headingText(children.props.children as React.ReactNode);
  }
  return "";
}

export function Markdown({
  children,
  className,
  anchors = false,
}: {
  children: string;
  className?: string;
  anchors?: boolean;
}) {
  return (
    <div className={cn("prose-tasu", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: label }) => {
            const url = href ?? "#";
            if (url.startsWith("/")) {
              return <Link href={url}>{label}</Link>;
            }
            return (
              <a href={url} target="_blank" rel="noreferrer noopener">
                {label}
              </a>
            );
          },
          ...(anchors
            ? {
                h2: ({ children: label }) => {
                  const id = slugifyHeading(headingText(label));
                  return <h2 id={id}>{label}</h2>;
                },
                h3: ({ children: label }) => {
                  const id = slugifyHeading(headingText(label));
                  return <h3 id={id}>{label}</h3>;
                },
              }
            : {}),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function plainText(markdown: string, limit = 160) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-]+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

export function readingMinutes(body: string) {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
