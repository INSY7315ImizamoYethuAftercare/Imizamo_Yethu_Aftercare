import { pdf, Document, Page, Text, View, Image, Svg, Line, Polyline, Circle, StyleSheet } from "@react-pdf/renderer";

const ORANGE = "#F97316";
const INK = "#111827";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";
const CREAM = "#FFF7ED";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: ORANGE,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 52,
    height: 52,
    objectFit: "contain",
  },
  org: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  tagline: {
    fontSize: 8,
    color: "#A855F7",
    marginTop: 2,
  },
  headerMeta: {
    textAlign: "right",
    fontSize: 8,
    color: MUTED,
  },
  badge: {
    marginTop: 6,
    backgroundColor: CREAM,
    color: ORANGE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-end",
  },
  titleBlock: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 4,
  },
  period: {
    fontSize: 10,
    color: MUTED,
  },
  intro: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.4,
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  kpi: {
    width: "48%",
    marginRight: "4%",
    marginBottom: 10,
    padding: 12,
    backgroundColor: CREAM,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  kpiLast: {
    marginRight: 0,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    marginBottom: 3,
  },
  kpiLabel: {
    fontSize: 8,
    color: MUTED,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginTop: 8,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ORANGE,
    color: "#FFFFFF",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  tableRowAlt: {
    backgroundColor: "#FFFBF5",
  },
  colLabel: { width: "62%" },
  colValue: { width: "38%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
});

function isEven(i) {
  return i % 2 === 0;
}

function PageHeader({ title, period }) {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image src="/logo.png" style={styles.logo} />
          <View>
            <Text style={styles.org}>Imizamo Yethu Learning Hub</Text>
            <Text style={styles.tagline}>Learn. Grow. Thrive.</Text>
          </View>
        </View>
        <View>
          <Text style={styles.headerMeta}>Aftercare System</Text>
          <Text style={styles.headerMeta}>Hout Bay · Cape Town</Text>
          <Text style={styles.badge}>CONFIDENTIAL</Text>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.period}>{period}</Text>
      </View>
    </>
  );
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Imizamo Yethu Learning Hub · Aftercare System</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

// Charts that can follow the key figures in a report:
//   { type: "split", heading, parts: [{ label, value, color }] }       one bar split into parts
//   { type: "bars",  heading, items: [{ label, value, display, color }] }  value 0-100 (or relative to `max`);
//                    an item can instead give `parts: [{ value, color }]` to draw a stacked bar
//   { type: "line",  heading, points: [{ label, value }] }              0-100 line chart
function ChartSection({ chart }) {
  if (chart.type === "line") {
    return (
      <View wrap={false} style={{ marginBottom: 6 }}>
        <Text style={styles.sectionTitle}>{chart.heading}</Text>
        {chart.points.some(hasValue) ? (
          <View style={{ width: CHART.w, height: CHART.h }}>
            <LineChartSvg points={chart.points} />
            <ChartLabels points={chart.points} />
          </View>
        ) : (
          <Text style={styles.intro}>Nothing was recorded in this period yet.</Text>
        )}
      </View>
    );
  }

  if (chart.type === "split") {
    const total = chart.parts.reduce((sum, p) => sum + p.value, 0);
    return (
      <View wrap={false} style={{ marginBottom: 6 }}>
        <Text style={styles.sectionTitle}>{chart.heading}</Text>
        {total === 0 ? (
          <Text style={styles.intro}>Nothing was recorded in this period yet.</Text>
        ) : (
          <>
            <View style={{ flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden", backgroundColor: LINE }}>
              {chart.parts.map((p) => (
                <View key={p.label} style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }} />
              ))}
            </View>
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              {chart.parts.map((p) => (
                <View key={p.label} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color, marginRight: 5 }} />
                  <Text style={{ fontSize: 9, color: MUTED }}>{p.label}: </Text>
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{p.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    );
  }

  // bars
  const sizeOf = (i) => i.value ?? (i.parts ? i.parts.reduce((sum, p) => sum + p.value, 0) : 0);
  const max = chart.max ?? Math.max(1, ...chart.items.map(sizeOf));
  return (
    <View wrap={false} style={{ marginBottom: 6 }}>
      <Text style={styles.sectionTitle}>{chart.heading}</Text>
      {chart.items.length === 0 ? (
        <Text style={styles.intro}>Nothing was recorded in this period yet.</Text>
      ) : (
        chart.items.map((item) => (
          <View key={item.label} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ width: 90, fontSize: 9 }}>{item.label}</Text>
            <View style={{ flex: 1, height: 9, borderRadius: 5, backgroundColor: LINE, overflow: "hidden" }}>
              {item.parts ? (
                <View style={{ flexDirection: "row", height: 9, width: `${Math.min(100, (sizeOf(item) / max) * 100)}%` }}>
                  {item.parts.map((p, i) => (
                    <View key={i} style={{ width: `${sizeOf(item) === 0 ? 0 : (p.value / sizeOf(item)) * 100}%`, height: 9, backgroundColor: p.color }} />
                  ))}
                </View>
              ) : (
                hasValue(item) && (
                  <View style={{ width: `${Math.min(100, (item.value / max) * 100)}%`, height: 9, backgroundColor: item.color ?? ORANGE }} />
                )
              )}
            </View>
            <Text style={{ width: item.parts ? 110 : 70, fontSize: 9, textAlign: "right", fontFamily: "Helvetica-Bold" }}>
              {item.parts || hasValue(item) ? item.display ?? String(item.value) : "No data yet"}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function ReportPdf({ title, period, summary, rows, charts = [] }) {
  return (
    <Document
      title={`${title} · Imizamo Yethu Learning Hub`}
      author="Imizamo Yethu Learning Hub"
    >
      <Page size="A4" style={styles.page}>
        <PageHeader title={title} period={period} />

        {summary && (
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: ORANGE, lineHeight: 1.4, marginBottom: 8 }}>{summary}</Text>
        )}
        <Text style={styles.intro}>
          Summary prepared for internal review from the attendance, sign-out and
          observation records captured in the Aftercare System.
        </Text>

        <Text style={styles.sectionTitle}>Key figures</Text>
        <View style={styles.grid}>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.kpi, i % 2 === 1 ? styles.kpiLast : {}]}
            >
              <Text style={styles.kpiValue}>{row.value}</Text>
              <Text style={styles.kpiLabel}>{row.label}</Text>
            </View>
          ))}
        </View>

        {charts.map((chart) => (
          <ChartSection key={chart.heading} chart={chart} />
        ))}

        <Text style={styles.sectionTitle}>Detail</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colLabel}>Metric</Text>
          <Text style={styles.colValue}>Value</Text>
        </View>
        {rows.map((row, i) => (
          <View
            key={`row-${row.label}`}
            style={[styles.tableRow, isEven(i) ? styles.tableRowAlt : {}]}
          >
            <Text style={styles.colLabel}>{row.label}</Text>
            <Text style={styles.colValue}>{row.value}</Text>
          </View>
        ))}

        <PageFooter />
      </Page>
    </Document>
  );
}

// A line chart drawn as vector shapes. Points with no value are left out, so a
// window with nothing recorded shows as a gap rather than a drop to zero.
const CHART = { w: 523, h: 230, left: 34, right: 14, top: 18, bottom: 26 };
const chartX = (i, count) =>
  CHART.left + (count === 1 ? (CHART.w - CHART.left - CHART.right) / 2 : (i / (count - 1)) * (CHART.w - CHART.left - CHART.right));
const chartY = (v) => CHART.top + (CHART.h - CHART.top - CHART.bottom) * (1 - v / 100);
const hasValue = (p) => p.value !== null && p.value !== undefined;
const GRID = [0, 25, 50, 75, 100];

function LineChartSvg({ points }) {
  // Runs of consecutive points that have a value.
  const runs = [];
  let current = null;
  points.forEach((p, i) => {
    if (!hasValue(p)) {
      current = null;
      return;
    }
    if (!current) {
      current = [];
      runs.push(current);
    }
    current.push([chartX(i, points.length), chartY(p.value)]);
  });

  return (
    <Svg width={CHART.w} height={CHART.h}>
      {GRID.map((v) => (
        <Line key={v} x1={CHART.left} x2={CHART.w - CHART.right} y1={chartY(v)} y2={chartY(v)} stroke={LINE} strokeWidth={1} />
      ))}
      {runs
        .filter((r) => r.length > 1)
        .map((r, i) => (
          <Polyline key={i} points={r.map((p) => p.join(",")).join(" ")} stroke={ORANGE} strokeWidth={2.5} fill="none" />
        ))}
      {points.map((p, i) =>
        hasValue(p) ? <Circle key={p.label} cx={chartX(i, points.length)} cy={chartY(p.value)} r={3.5} fill={ORANGE} /> : null,
      )}
    </Svg>
  );
}

// Axis labels and values go on as ordinary PDF text over the drawing, which
// renders more reliably than text inside the SVG.
function ChartLabels({ points }) {
  const small = { position: "absolute", fontSize: 8, color: MUTED };
  return (
    <>
      {GRID.map((v) => (
        <Text key={v} style={{ ...small, left: 0, width: CHART.left - 6, textAlign: "right", top: chartY(v) - 5 }}>
          {v}%
        </Text>
      ))}
      {points.map((p, i) => (
        <Text key={`x-${p.label}`} style={{ ...small, left: chartX(i, points.length) - 20, width: 40, textAlign: "center", top: CHART.h - CHART.bottom + 8 }}>
          {p.label}
        </Text>
      ))}
      {points.map((p, i) =>
        hasValue(p) ? (
          <Text
            key={`v-${p.label}`}
            style={{ ...small, color: INK, fontFamily: "Helvetica-Bold", left: chartX(i, points.length) - 20, width: 40, textAlign: "center", top: chartY(p.value) - 15 }}
          >
            {p.value}%
          </Text>
        ) : null,
      )}
    </>
  );
}

function ChartPdf({ title, period, heading, points }) {
  return (
    <Document title={`${title} · Imizamo Yethu Learning Hub`} author="Imizamo Yethu Learning Hub">
      <Page size="A4" style={styles.page}>
        <PageHeader title={title} period={period} />

        <Text style={styles.sectionTitle}>{heading}</Text>
        {points.some(hasValue) ? (
          <View style={{ width: CHART.w, height: CHART.h, marginBottom: 14 }}>
            <LineChartSvg points={points} />
            <ChartLabels points={points} />
          </View>
        ) : (
          <Text style={styles.intro}>No attendance was recorded in this period, so there is nothing to chart yet.</Text>
        )}

        <Text style={styles.sectionTitle}>Detail</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colLabel}>Period</Text>
          <Text style={styles.colValue}>Attendance rate</Text>
        </View>
        {points.map((p, i) => (
          <View key={`row-${p.label}`} style={[styles.tableRow, isEven(i) ? styles.tableRowAlt : {}]}>
            <Text style={styles.colLabel}>{p.label}</Text>
            <Text style={styles.colValue}>{hasValue(p) ? `${p.value}%` : "No data yet"}</Text>
          </View>
        ))}

        <PageFooter />
      </Page>
    </Document>
  );
}

async function download(doc, filename) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".pdf";
  link.click();
  URL.revokeObjectURL(url);
}

/** `summary` is the one-line takeaway; `charts` follow the key figures (see ChartSection). */
export async function generatePDF({ filename = "imizamo-report", title, period, summary, rows, charts }) {
  await download(<ReportPdf title={title} period={period} summary={summary} rows={rows} charts={charts} />, filename);
}

/** points: [{ label, value }], value a 0-100 percentage or null for "no data". */
export async function generateChartPDF({ filename = "imizamo-chart", title, period, heading, points }) {
  await download(<ChartPdf title={title} period={period} heading={heading} points={points} />, filename);
}