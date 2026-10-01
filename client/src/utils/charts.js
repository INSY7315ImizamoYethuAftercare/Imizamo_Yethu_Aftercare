export function exportChart(filename = "imizamo-chart") {
  const text = "Imizamo Yethu Learning Hub — chart export (demo)\n" + filename;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + ".txt";
  link.click();
  URL.revokeObjectURL(url);
}