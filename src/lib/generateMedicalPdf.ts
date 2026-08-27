// Shared PDF template for signed medical documents — used by the video
// consultation, in-clinic appointment, and diagnostics doctor pages so a
// signed report looks and behaves identically regardless of which kind of
// visit it came from. Mirrors the template that originally only existed
// inside the video-call page's FloatingConsultationButton.

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
    .map(s => `
      <div style="margin-bottom: 15px; page-break-inside: avoid;">
        <h3 style="margin: 0 0 8px; font-size: 13px; color: #1e3a5f; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #1e3a5f; padding-bottom: 3px;">${s.label}</h3>
        <p style="margin: 0; font-size: 14px; color: #000; text-align: justify; white-space: pre-wrap;">${s.content}</p>
      </div>
    `).join("");

  const pdfContent = `
    <div style="font-family: 'Times New Roman', Times, serif; padding: 30px 40px; max-width: 800px; margin: 0 auto; color: #000; font-size: 14px; line-height: 1.5;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1e3a5f;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="/logosaas_new2.png" alt="ZhanCare Logo" style="height: 45px; width: auto;" />
        </div>
        <div style="text-align: right; font-size: 12px; color: #333;">
          <p style="margin: 0;">Дата: <strong>${formattedDate}</strong></p>
          <p style="margin: 3px 0 0;">Время: <strong>${formattedTime}</strong></p>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="margin: 0; font-size: 18px; color: #000; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${documentTitle}</h2>
        <p style="margin: 5px 0 0; font-size: 12px; color: #555;">${documentSubtitle}</p>
      </div>

      <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; padding: 10px; border: 1px solid #ccc; background: #f8f9fa;">
            <strong style="font-size: 12px; color: #1e3a5f;">ПАЦИЕНТ:</strong><br/>
            <span style="font-size: 14px;">${patientName}</span>
          </td>
          <td style="width: 50%; padding: 10px; border: 1px solid #ccc; background: #f8f9fa;">
            <strong style="font-size: 12px; color: #1e3a5f;">ЛЕЧАЩИЙ ВРАЧ:</strong><br/>
            <span style="font-size: 14px;">${doctorName}</span>
          </td>
        </tr>
      </table>

      ${sectionsHtml}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: bottom; padding: 10px 0;">
              <p style="margin: 0; font-size: 11px; color: #777;">Документ сформирован: ${formattedDate} ${formattedTime}</p>
              <p style="margin: 3px 0 0; font-size: 11px; color: #777;">© ZhanCare ${currentDate.getFullYear()}</p>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: bottom; padding: 10px 0;">
              <div style="display: inline-block; text-align: left;">
                <p style="margin: 0 0 5px; font-size: 12px; color: #333;">Лечащий врач: <strong>${doctorName}</strong></p>
                <img src="${signature}" style="height: 50px; width: auto; margin: 5px 0;" alt="Подпись врача" />
                <p style="margin: 5px 0 0; font-size: 11px; color: #555;">Подпись / М.П.</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = pdfContent;
  document.body.appendChild(container);

  const filename = `${filenamePrefix}_${patientName.replace(/\s+/g, "_")}_${formattedDate.replace(/\./g, "-")}.pdf`;
  const opt = {
    margin: 10,
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
