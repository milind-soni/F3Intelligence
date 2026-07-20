// Safe math expression evaluator + descriptive/inferential statistics.
// No eval/Function — a small recursive-descent parser handles expressions.

// ---------- Expression evaluator ----------

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
  deg: (x) => (x * 180) / Math.PI,
  rad: (x) => (x * Math.PI) / 180,
  fact: factorial,
  factorial,
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  pow: (a, b) => Math.pow(a, b),
  ncr: (n, r) => combinations(n, r),
  npr: (n, r) => permutations(n, r),
  mod: (a, b) => ((a % b) + b) % b,
};

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error("factorial needs a non-negative integer");
  if (n > 170) throw new Error("factorial overflow (max 170)");
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  r = Math.min(r, n - r);
  let result = 1;
  for (let i = 0; i < r; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

function permutations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let result = 1;
  for (let i = 0; i < r; i++) result *= n - i;
  return result;
}

type Token =
  | { kind: "num"; value: number }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.replace(/,(?=\d{2,3}\b)/g, ""); // strip thousands separators like 4,50,000
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.eE]/.test(s[j])) {
        if ((s[j] === "e" || s[j] === "E") && !/[0-9+-]/.test(s[j + 1] ?? "")) break;
        if ((s[j] === "e" || s[j] === "E") && /[+-]/.test(s[j + 1] ?? "")) j++;
        j++;
      }
      const value = parseFloat(s.slice(i, j));
      if (Number.isNaN(value)) throw new Error(`bad number at "${s.slice(i, j)}"`);
      tokens.push({ kind: "num", value });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z_0-9]/.test(s[j])) j++;
      tokens.push({ kind: "ident", value: s.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^%(),!".includes(c)) {
      tokens.push({ kind: "op", value: c });
      i++;
      continue;
    }
    if (c === "×") { tokens.push({ kind: "op", value: "*" }); i++; continue; }
    if (c === "÷") { tokens.push({ kind: "op", value: "/" }); i++; continue; }
    throw new Error(`unexpected character "${c}"`);
  }
  return tokens;
}

export function evaluateExpression(expr: string): number {
  const tokens = tokenize(expr);
  let pos = 0;

  const peek = () => tokens[pos];
  const eat = (value?: string): Token => {
    const t = tokens[pos];
    if (!t) throw new Error("unexpected end of expression");
    if (value && !(t.kind === "op" && t.value === value))
      throw new Error(`expected "${value}"`);
    pos++;
    return t;
  };

  function parseExpr(): number {
    let left = parseTerm();
    while (peek()?.kind === "op" && (peek() as Token & { value: string }).value.match(/^[+-]$/)) {
      const op = (eat() as { value: string }).value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseUnary();
    while (peek()?.kind === "op" && /^[*/%]$/.test((peek() as { value: string }).value)) {
      const op = (eat() as { value: string }).value;
      const right = parseUnary();
      if (op === "*") left *= right;
      else if (op === "/") left /= right;
      else left %= right;
    }
    return left;
  }

  function parseUnary(): number {
    const t = peek();
    if (t?.kind === "op" && t.value === "-") { eat(); return -parseUnary(); }
    if (t?.kind === "op" && t.value === "+") { eat(); return parseUnary(); }
    return parsePower();
  }

  function parsePower(): number {
    const base = parsePostfix();
    if (peek()?.kind === "op" && (peek() as { value: string }).value === "^") {
      eat();
      return Math.pow(base, parseUnary()); // right-associative
    }
    return base;
  }

  function parsePostfix(): number {
    let value = parseAtom();
    while (peek()?.kind === "op" && (peek() as { value: string }).value === "!") {
      eat();
      value = factorial(value);
    }
    return value;
  }

  function parseAtom(): number {
    const t = peek();
    if (!t) throw new Error("unexpected end of expression");
    if (t.kind === "num") { eat(); return t.value; }
    if (t.kind === "op" && t.value === "(") {
      eat();
      const v = parseExpr();
      eat(")");
      return v;
    }
    if (t.kind === "ident") {
      eat();
      if (t.value in CONSTANTS && !(peek()?.kind === "op" && (peek() as { value: string }).value === "(")) {
        return CONSTANTS[t.value];
      }
      const fn = FUNCTIONS[t.value];
      if (!fn) throw new Error(`unknown function or constant "${t.value}"`);
      eat("(");
      const args: number[] = [parseExpr()];
      while (peek()?.kind === "op" && (peek() as { value: string }).value === ",") {
        eat();
        args.push(parseExpr());
      }
      eat(")");
      return fn(...args);
    }
    throw new Error(`unexpected token`);
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error("unexpected trailing input");
  if (!Number.isFinite(result)) throw new Error("result is not finite");
  return result;
}

// ---------- Statistics ----------

const r4 = (x: number) => Math.round(x * 10000) / 10000;

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function describe(data: number[]) {
  const n = data.length;
  if (n === 0) throw new Error("empty dataset");
  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const deviations = data.map((x) => x - mean);
  const popVariance = deviations.reduce((a, d) => a + d * d, 0) / n;
  const sampleVariance = n > 1 ? deviations.reduce((a, d) => a + d * d, 0) / (n - 1) : 0;
  const sd = Math.sqrt(sampleVariance);
  const q1 = percentile(sorted, 25);
  const median = percentile(sorted, 50);
  const q3 = percentile(sorted, 75);

  const counts = new Map<number, number>();
  for (const x of data) counts.set(x, (counts.get(x) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  const mode =
    maxCount > 1 ? [...counts.entries()].filter(([, c]) => c === maxCount).map(([v]) => v).slice(0, 5) : null;

  const skewness =
    n > 2 && sd > 0
      ? (n / ((n - 1) * (n - 2))) * deviations.reduce((a, d) => a + Math.pow(d / sd, 3), 0)
      : null;
  const kurtosis =
    n > 3 && sd > 0
      ? ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) *
          deviations.reduce((a, d) => a + Math.pow(d / sd, 4), 0) -
        (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3))
      : null;

  return {
    count: n,
    sum: r4(sum),
    mean: r4(mean),
    median: r4(median),
    mode,
    min: sorted[0],
    max: sorted[n - 1],
    range: r4(sorted[n - 1] - sorted[0]),
    q1: r4(q1),
    q3: r4(q3),
    iqr: r4(q3 - q1),
    sampleVariance: r4(sampleVariance),
    populationVariance: r4(popVariance),
    sampleStdDev: r4(sd),
    populationStdDev: r4(Math.sqrt(popVariance)),
    coefficientOfVariation: mean !== 0 ? r4(sd / Math.abs(mean)) : null,
    standardError: r4(sd / Math.sqrt(n)),
    skewness: skewness !== null ? r4(skewness) : null,
    excessKurtosis: kurtosis !== null ? r4(kurtosis) : null,
    p5: r4(percentile(sorted, 5)),
    p95: r4(percentile(sorted, 95)),
  };
}

export function bivariate(x: number[], y: number[]) {
  if (x.length !== y.length) throw new Error("x and y must have the same length");
  const n = x.length;
  if (n < 2) throw new Error("need at least 2 pairs");
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - meanX) * (y[i] - meanY);
    sxx += (x[i] - meanX) ** 2;
    syy += (y[i] - meanY) ** 2;
  }
  const r = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
  const slope = sxx > 0 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;
  return {
    n,
    pearsonR: r4(r),
    rSquared: r4(r * r),
    sampleCovariance: r4(sxy / (n - 1)),
    regression: {
      slope: r4(slope),
      intercept: r4(intercept),
      equation: `y = ${r4(slope)}x ${intercept >= 0 ? "+" : "-"} ${r4(Math.abs(intercept))}`,
    },
  };
}

export function growthMetrics(series: number[]) {
  if (series.length < 2) throw new Error("need at least 2 values");
  const first = series[0];
  const last = series[series.length - 1];
  const periods = series.length - 1;
  const pctChanges = series.slice(1).map((v, i) => (series[i] !== 0 ? (v - series[i]) / series[i] : 0));
  const cagr = first > 0 && last > 0 ? Math.pow(last / first, 1 / periods) - 1 : null;
  return {
    first: r4(first),
    last: r4(last),
    totalChangePct: first !== 0 ? r4(((last - first) / first) * 100) : null,
    avgPeriodGrowthPct: r4((pctChanges.reduce((a, b) => a + b, 0) / pctChanges.length) * 100),
    compoundGrowthRatePct: cagr !== null ? r4(cagr * 100) : null,
    volatilityPct: r4(describe(pctChanges.map((p) => p * 100)).sampleStdDev),
  };
}
