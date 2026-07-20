"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Calculator,
  Sigma,
  Database,
  Users,
  Tractor,
  Apple,
  IndianRupee,
  CloudSun,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_META: Record<string, { label: string; icon: React.ElementType }> = {
  calculate: { label: "Calculator", icon: Calculator },
  statistics: { label: "Statistics", icon: Sigma },
  getSalesData: { label: "Sales data", icon: Database },
  getRetailers: { label: "Retailers", icon: Users },
  getCustomerBreakdown: { label: "Customers", icon: Users },
  getFarmerSupply: { label: "Farmer supply", icon: Tractor },
  getSkuCatalog: { label: "SKU catalog", icon: Apple },
  getMandiPrices: { label: "Mandi prices", icon: IndianRupee },
  getWeather: { label: "Weather", icon: CloudSun },
};

const SUGGESTIONS = [
  "Mean, median and std deviation of weekly ANAR sales",
  "Is WATERMELON weekly volume correlated with total volume?",
  "Compare retailer credit scores: GURUGRAM vs SOUTH DELHI",
  "What's the CAGR of our monthly sales volume?",
  "Top 5 farmer vendors for ANAR and their share of supply",
  "Calculate 18% GST on ₹4,52,300 split across 12 months",
];

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={`${keyPrefix}-b${i}`}>{tok.slice(2, -2)}</strong>);
    } else {
      out.push(
        <code key={`${keyPrefix}-c${i}`} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // table block
    if (line.trim().startsWith("|") && lines[i + 1]?.trim().match(/^\|[\s:|-]+\|$/)) {
      const header = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        rows.push(lines[j].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        j++;
      }
      blocks.push(
        <div key={key++} className="my-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/60">
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} className="px-3 py-1.5 text-left font-semibold">{renderInline(h, `th${hi}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t border-border/60">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-1.5 tabular-nums">{renderInline(c, `td${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }

    if (/^#{1,4}\s/.test(line)) {
      blocks.push(
        <p key={key++} className="mt-2 mb-1 text-sm font-bold">
          {renderInline(line.replace(/^#{1,4}\s/, ""), `h${key}`)}
        </p>
      );
      i++;
      continue;
    }

    if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-1 space-y-0.5 pl-4">
          {items.map((it, ii) => (
            <li key={ii} className="list-disc">{renderInline(it, `li${ii}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    blocks.push(<p key={key++} className="my-1">{renderInline(line, `p${key}`)}</p>);
    i++;
  }

  return <div className="text-sm leading-relaxed">{blocks}</div>;
}

type ToolPart = {
  type: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function ToolChip({ part }: { part: ToolPart }) {
  const [open, setOpen] = useState(false);
  const name = part.type.replace(/^tool-/, "");
  const meta = TOOL_META[name] ?? { label: name, icon: Database };
  const Icon = meta.icon;
  const done = part.state === "output-available";
  const errored = part.state === "output-error";

  let detail = "";
  if (name === "calculate" && part.input && typeof part.input === "object") {
    detail = String((part.input as { expression?: string }).expression ?? "");
  }
  const resultNum =
    done && part.output && typeof part.output === "object" && "result" in (part.output as object)
      ? (part.output as { result?: number }).result
      : undefined;

  return (
    <div className="my-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
          errored
            ? "border-red-200 bg-red-50 text-red-700"
            : done
            ? "border-primary/25 bg-primary/8 text-primary hover:bg-primary/15"
            : "border-border bg-muted/50 text-muted-foreground"
        )}
      >
        {done ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : errored ? (
          <XCircle className="h-3 w-3" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        <Icon className="h-3 w-3" />
        <span>{meta.label}</span>
        {detail && <span className="max-w-[220px] truncate font-mono opacity-70">{detail}</span>}
        {resultNum !== undefined && (
          <span className="font-mono font-bold">= {Number(resultNum).toLocaleString("en-IN")}</span>
        )}
      </button>
      {open && (done || errored) && (
        <pre className="mt-1.5 max-h-56 overflow-auto rounded-lg border border-border bg-muted/40 p-2.5 text-[10.5px] leading-snug font-mono">
          {errored ? part.errorText : JSON.stringify(part.output, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AnalystChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[420px] flex-col rounded-xl border border-border bg-card shadow-sm lg:h-[calc(100vh-150px)]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-display text-xl">Ask the F3 Analyst</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Exact math, statistics, and live answers computed over your sales, retailer,
                farmer, mandi and weather data.
              </p>
            </div>
            <div className="flex max-w-2xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[92%] lg:max-w-[80%]",
                message.role === "user"
                  ? "rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "w-full"
              )}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return message.role === "user" ? (
                    <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                  ) : (
                    <Markdown key={i} text={part.text} />
                  );
                }
                if (part.type.startsWith("tool-")) {
                  return <ToolChip key={i} part={part as unknown as ToolPart} />;
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysing…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Something went wrong: {error.message}. Try again.
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3 lg:p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="Ask anything — stats, forecasts, math, your data…"
          className="h-11 flex-1 rounded-lg border border-input bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
