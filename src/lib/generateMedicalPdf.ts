// Shared PDF template for signed medical documents — used by the video
// consultation, in-clinic appointment, and diagnostics doctor pages (and the
// admin's template preview) so a signed report looks and behaves identically
// regardless of which kind of visit it came from.

export interface MedicalPdfSection {
  label: string;
  content: string;
}

export interface GenerateMedicalPdfOptions {
  documentTitle: string;
  documentSubtitle?: string;
  patientName: string;
  doctorName: string;
  sections: MedicalPdfSection[];
  signature: string; // data URL from SignatureModal
  filenamePrefix?: string;
}

// Section content and names are real free text (doctor-typed) — escape before
// dropping into innerHTML so "<", ">", "&" can't break the layout or, worse,
// get interpreted as markup.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const BRAND_BLUE = "#3772ff";
const BRAND_NAVY = "#1e3a5f";
const HEADING_FONT = "-apple-system, 'Segoe UI', Arial, sans-serif";
const BODY_FONT = "Georgia, 'Times New Roman', serif";

export async function generateMedicalPdf({
  documentTitle,
  documentSubtitle = "Медицинское заключение",
  patientName,
  doctorName,
  sections,
  signature,
  filenamePrefix = "document",
}: GenerateMedicalPdfOptions): Promise<{ blob: Blob; filename: string }> {
  const html2pdf = (await import("html2pdf.js")).default;

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const formattedTime = currentDate.toLocaleTimeString("ru-RU", {
    hour: "2-digit", minute: "2-digit",
  });

  const sectionsHtml = sections
    .filter(s => s.content && s.content.trim())
    .map((s, i) => `
      <div style="margin-bottom: 14px; page-break-inside: avoid; background: #fafbfe; border-left: 3px solid ${BRAND_BLUE}; border-radius: 0 10px 10px 0; padding: 14px 16px;">
        <h3 style="margin: 0 0 8px; font-family: ${HEADING_FONT}; font-size: 12px; color: ${BRAND_NAVY}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;">${escapeHtml(s.label)}</h3>
        <p style="margin: 0; font-family: ${BODY_FONT}; font-size: 14px; color: #1a1a1a; text-align: justify; white-space: pre-wrap; line-height: 1.55;">${escapeHtml(s.content)}</p>
      </div>
    `).join("");

  const pdfContent = `
    <div style="font-family: ${BODY_FONT}; color: #1a1a1a; font-size: 14px; line-height: 1.5;">
      <!-- Top accent bar -->
      <div style="height: 6px; background: linear-gradient(90deg, ${BRAND_BLUE}, #2956bf);"></div>

      <div style="padding: 26px 40px 34px;">
        <!-- Header — table, not flex: html2canvas sizes flex children unreliably. -->
        <div style="margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f5;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle;">
                <img src="/logosaas_new2.png" alt="ZhanCare Logo" style="height: 42px; width: auto;" />
              </td>
              <td style="text-align: right; vertical-align: middle; font-family: ${HEADING_FONT}; font-size: 11px; color: #64748b;">
                Дата: <strong style="color: ${BRAND_NAVY};">${formattedDate}</strong>&nbsp;&nbsp;&nbsp;Время: <strong style="color: ${BRAND_NAVY};">${formattedTime}</strong>
              </td>
            </tr>
          </table>
        </div>

        <!-- Title -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; padding: 0; line-height: 28px; font-family: ${HEADING_FONT}; font-size: 20px; color: ${BRAND_NAVY}; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;">${escapeHtml(documentTitle)}</h1>
          <div style="width: 56px; height: 3px; margin: 14px auto 0; background: linear-gradient(90deg, ${BRAND_BLUE}, #2956bf); border-radius: 2px;"></div>
          <p style="margin: 10px 0 0; font-family: ${HEADING_FONT}; font-size: 11px; color: #94a3b8; letter-spacing: 0.3px;">${escapeHtml(documentSubtitle)}</p>
        </div>

        <!-- Patient & Doctor Info -->
        <table style="width: 100%; margin-bottom: 22px; border-collapse: separate; border-spacing: 10px 0;">
          <tr>
            <td style="width: 50%; padding: 12px 14px; background: #f5f8ff; border-left: 3px solid ${BRAND_BLUE}; border-radius: 0 10px 10px 0;">
              <div style="font-family: ${HEADING_FONT}; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Пациент</div>
              <div style="font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_NAVY}; font-weight: 600;">${escapeHtml(patientName)}</div>
            </td>
            <td style="width: 50%; padding: 12px 14px; background: #f5f8ff; border-left: 3px solid ${BRAND_BLUE}; border-radius: 0 10px 10px 0;">
              <div style="font-family: ${HEADING_FONT}; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">Лечащий врач</div>
              <div style="font-family: ${BODY_FONT}; font-size: 15px; color: ${BRAND_NAVY}; font-weight: 600;">${escapeHtml(doctorName)}</div>
            </td>
          </tr>
        </table>

        ${sectionsHtml}

        <!-- Footer -->
        <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f5;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; vertical-align: bottom; padding: 10px 0;">
                <p style="margin: 0; font-family: ${HEADING_FONT}; font-size: 10px; color: #94a3b8;">Документ сформирован: ${formattedDate} ${formattedTime}</p>
                <p style="margin: 3px 0 0; font-family: ${HEADING_FONT}; font-size: 10px; color: #94a3b8;">© ZhanCare.Ai ${currentDate.getFullYear()}</p>
              </td>
              <td style="width: 50%; text-align: right; vertical-align: bottom; padding: 10px 0;">
                <div style="display: inline-block; text-align: left;">
                  <p style="margin: 0 0 4px; font-family: ${HEADING_FONT}; font-size: 11px; color: #475569;">Лечащий врач: <strong style="color: ${BRAND_NAVY};">${escapeHtml(doctorName)}</strong></p>
                  <img src="${signature}" style="height: 46px; width: auto; margin: 4px 0;" alt="Подпись врача" />
                  <p style="margin: 4px 0 0; padding-top: 4px; border-top: 1px solid #cbd5e1; font-family: ${HEADING_FONT}; font-size: 10px; color: #94a3b8;">Подпись / М.П.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 18px; font-family: ${HEADING_FONT}; font-size: 9px; letter-spacing: 0.4px; color: #b6c2d9;">
          СФОРМИРОВАНО В ZHANCARE.AI
        </div>
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = pdfContent;
  document.body.appendChild(container);

  const filename = `${filenamePrefix}_${patientName.replace(/\s+/g, "_")}_${formattedDate.replace(/\./g, "-")}.pdf`;
  const opt = {
    margin: 0,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
  };

  try {
    const blob: Blob = await html2pdf().set(opt).from(container).output("blob");
    return { blob, filename };
  } finally {
    document.body.removeChild(container);
  }
}
