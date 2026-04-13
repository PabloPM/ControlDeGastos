import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const exportarReportePDF = async (gastos, deudas) => {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
          h1 { color: #3B82F6; text-align: center; }
          .resumen { margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #F3F4F6; text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
          td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
          .monto { font-weight: bold; text-align: right; }
          .positivo { color: #10B981; }
        </style>
      </head>
      <body>
        <h1>Reporte de Gastos y Deudas</h1>
        <div class="resumen">
          <p>Generado el: ${new Date().toLocaleDateString()}</p>
        </div>

        <h3>Historial de Gastos</h3>
        <table>
          <tr><th>Descripción</th><th>Categoría</th><th>Monto</th></tr>
          ${gastos.map(g => `
            <tr>
              <td>${g.description}</td>
              <td>${g.categories?.name || 'Otros'}</td>
              <td class="monto">$${g.amount}</td>
            </tr>
          `).join('')}
        </table>

        <h3>Pagos de Contactos (Hermano/Amigos)</h3>
        <table>
          <tr><th>Persona</th><th>Concepto</th><th>Monto</th></tr>
          ${deudas.map(d => `
            <tr>
              <td>${d.external_contacts?.name}</td>
              <td>${d.expenses?.description}</td>
              <td class="monto positivo">$${d.share_amount}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;

  try {
    // 1. Crear el archivo PDF
    const { uri } = await Print.printToFileAsync({ html });
    // 2. Abrir el menú de compartir (WhatsApp, Email, etc)
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    alert("Error al generar PDF: " + error.message);
  }
};
