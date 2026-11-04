import { pdf, Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { toCanvas } from "html-to-image";

// Report PDFs are pictures of the report page itself, so they look exactly like
// it, emojis and charts included. Each card is captured on its own and placed
// whole on the A4 page, so none is ever cut across two pages.

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = { side: 30, top: 28, bottom: 50 };
const HEADER_HEIGHT = 62; // the white bar and the gap under it

// The report is laid out at this width while it is captured, so the text comes
// out at a readable size whatever screen the PDF is made on.
const CAPTURE_WIDTH = 720;
// Room around a card for its shadow, which falls mostly downwards. This also
// makes the gap between cards.
const CAPTURE_PADDING = { top: 4, side: 14, bottom: 20 };
// Captures are solid rather than transparent: PDF viewers draw dark edges around
// a transparent image's shadows. So they sit on one flat page colour, the cream
// at the top of the app's orange-to-white background.
const PAGE_COLOUR = "#FFF7ED";
const CONTENT_WIDTH = A4.width - MARGIN.side * 2;
const PT_PER_PX = CONTENT_WIDTH / (CAPTURE_WIDTH + CAPTURE_PADDING.side * 2);
const MAX_BLOCK_HEIGHT = A4.height - MARGIN.top - MARGIN.bottom - HEADER_HEIGHT;

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN.top,
    paddingBottom: MARGIN.bottom,
    paddingHorizontal: MARGIN.side,
    fontFamily: "Helvetica",
    backgroundColor: PAGE_COLOUR,
  },
  // Reaches past the page margins to run edge to edge, like the app's top bar.
  header: {
    marginTop: -MARGIN.top,
    marginHorizontal: -MARGIN.side,
    marginBottom: 12,
    height: HEADER_HEIGHT - 12 + MARGIN.top,
    paddingTop: 12,
    paddingHorizontal: MARGIN.side + CAPTURE_PADDING.side * PT_PER_PX,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 32, height: 32, objectFit: "contain" },
  org: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#F97316" },
  title: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  badge: {
    backgroundColor: PAGE_COLOUR,
    color: "#F97316",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: MARGIN.side + CAPTURE_PADDING.side * PT_PER_PX,
    right: MARGIN.side + CAPTURE_PADDING.side * PT_PER_PX,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9CA3AF",
  },
});

function ReportDocument({ title, images }) {
  return (
    <Document title={`${title} · Imizamo Yethu Learning Hub`} author="Imizamo Yethu Learning Hub">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={styles.brand}>
            <Image src="/logo.png" style={styles.logo} />
            <View>
              <Text style={styles.org}>Imizamo Yethu Learning Hub</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>
          <Text style={styles.badge}>CONFIDENTIAL</Text>
        </View>

        {images.map((image, i) => (
          <View key={i} wrap={false}>
            <Image src={image.src} style={{ width: image.width, height: image.height, alignSelf: "center" }} />
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Imizamo Yethu Learning Hub · Aftercare System</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

async function captureBlock(block) {
  const { top, side, bottom } = CAPTURE_PADDING;
  const width = block.offsetWidth + side * 2;
  const height = block.offsetHeight + top + bottom;
  const shot = await toCanvas(block, {
    pixelRatio: 2,
    skipFonts: true, // the app uses system fonts, so there are none to embed
    width,
    height,
    // html-to-image stretches the card to the width and height above; keep its
    // real size so the padding goes around it rather than cutting it off.
    style: { margin: `${top}px ${side}px ${bottom}px`, width: `${block.offsetWidth}px`, height: `${block.offsetHeight}px` },
    filter: (node) => !node.hasAttribute?.("data-pdf-skip"),
  });
  // Flatten onto the page colour afterwards: html-to-image's own background
  // option would replace the card's white background too.
  const flat = document.createElement("canvas");
  flat.width = shot.width;
  flat.height = shot.height;
  const context = flat.getContext("2d");
  context.fillStyle = PAGE_COLOUR;
  context.fillRect(0, 0, flat.width, flat.height);
  context.drawImage(shot, 0, 0);
  const src = flat.toDataURL("image/png");
  // Anything taller than a page is shrunk to fit on one.
  const scale = Math.min(PT_PER_PX, MAX_BLOCK_HEIGHT / height);
  return { src, width: width * scale, height: height * scale };
}

const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads the report showing inside `root` as a PDF. Its first child is the
 * tab's content, and that content's first child is the banner.
 * Elements marked data-pdf-skip (the export buttons) are left out.
 * `onlySelector` limits the PDF to the banner and that one card.
 */
export async function exportPagePdf({ root, filename, title, onlySelector }) {
  const content = root.firstElementChild;
  const blocks = onlySelector
    ? [content.firstElementChild, content.querySelector(onlySelector)]
    : [...content.children].filter((block) => !block.hasAttribute("data-pdf-skip"));

  const originalWidth = root.style.width;
  root.style.width = `${CAPTURE_WIDTH}px`;
  // A scrolling table would be captured with scrollbars and its last row cut off.
  const scrollers = [...root.querySelectorAll(".overflow-x-auto")];
  scrollers.forEach((el) => { el.style.overflow = "visible"; });
  try {
    await nextPaint();
    await wait(150); // the charts redraw for the new width
    const images = [];
    for (const block of blocks) images.push(await captureBlock(block));
    download(await pdf(<ReportDocument title={title} images={images} />).toBlob(), filename);
  } finally {
    root.style.width = originalWidth;
    scrollers.forEach((el) => { el.style.overflow = ""; });
  }
}
