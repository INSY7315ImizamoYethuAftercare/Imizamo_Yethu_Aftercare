import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#111827" },
  title: { fontSize: 20, color: "#EA580C", marginBottom: 4 },
  sub: { fontSize: 10, color: "#6B7280", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  label: { color: "#6B7280" },
  value: { fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 28, fontSize: 9, color: "#9CA3AF" },
});

function ReportPdf({ title, period, rows }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Imizamo Yethu Learning Hub</Text>
        <Text style={styles.sub}>{title} · {period}</Text>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
        <Text style={styles.footer}>Demo export · dummy data · not an official record</Text>
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