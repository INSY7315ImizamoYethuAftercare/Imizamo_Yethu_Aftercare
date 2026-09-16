import { pdf, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const ORANGE = "#EA580C";
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

function ReportPdf({ title, period, rows }) {
  return (
    <Document
      title={`${title} · Imizamo Yethu Learning Hub`}
      author="Imizamo Yethu Learning Hub"
    >
      <Page size="A4" style={styles.page}>
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
            <Text style={styles.badge}>CONFIDENTIAL · DEMO</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>

        <Text style={styles.intro}>
          Summary prepared for internal review. Figures below are dummy demonstration
          data and must not be treated as an official organisational record.
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

        <View style={styles.footer} fixed>
          <Text>Imizamo Yethu Learning Hub · Demo export · dummy data</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generatePDF({ filename = "imizamo-report", title, period, rows }) {
  const blob = await pdf(
    <ReportPdf title={title} period={period} rows={rows} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".pdf";
  link.click();
  URL.revokeObjectURL(url);
}