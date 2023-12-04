'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const writtenNumber = require('written-number');
writtenNumber.defaults.lang = 'fr';




module.exports = {
  async create(ctx) {
    try {
      const {
        rentMonth,
        fullAddress,
        landlordFirstName,
        landlordLastName,
        tenantFirstName,
        tenantLastName,
        rentalPeriodStart,
        rentalPeriodEnd,
        rentAmount,
        utilitiesAmount,
        totalAmountInput,
        paymentDate,
        receiptDate,
        receiptLocation
      } = ctx.request.body;


      const formattedUtilitiesAmount = utilitiesAmount === '' ? null : utilitiesAmount;


      // Save the data to the database with original (unformatted) dates
      const newReceipt = await strapi.entityService.create('api::manual-receipt.manual-receipt', {
        data: {
          rentMonth: rentMonth,
          fullAddress: fullAddress,
          landlordFirstName: landlordFirstName,
          landlordLastName: landlordLastName,
          tenantFirstName: tenantFirstName,
          tenantLastName: tenantLastName,
          rentalPeriodStart: rentalPeriodStart,
          rentalPeriodEnd: rentalPeriodEnd,
          rentAmount: rentAmount,
          utilitiesAmount: formattedUtilitiesAmount,
          totalAmountInput: totalAmountInput,
          paymentDate: paymentDate,
          receiptDate: receiptDate,
          receiptLocation: receiptLocation,
          publishedAt: new Date(),
        },
      });

      // Format dates for PDF using toLocaleDateString
      const totalInWords = writtenNumber(totalAmountInput).toUpperCase();
      const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
      const formattedRentalPeriodStart = formatDate(rentalPeriodStart);
      const formattedRentalPeriodEnd = formatDate(rentalPeriodEnd);
      const formattedPaymentDate = formatDate(paymentDate);
      const formattedReceiptDate = formatDate(receiptDate);

      const formatDateToMonthYear = (dateString) => {
        const [year, month] = dateString.split('-');
        const formattedDate = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        // Capitalize the first letter of the month
        const capitalizedMonth = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
        return capitalizedMonth;
      };

      const formattedRentMonth = formatDateToMonthYear(rentMonth);

      // Generate the PDF
      const doc = new PDFDocument;
      ctx.set('Content-Type', 'application/pdf');
      ctx.set('Content-Disposition', 'attachment; filename=receipt.pdf');
      doc.pipe(ctx.res);

      doc.font('Helvetica');

      // Title
      doc.fontSize(16).fillColor('black').text('QUITTANCE', { align: 'center' });
      doc.moveDown();

      // Subtitle
      doc.fontSize(12);
      const text = `Quittance de loyer ${formattedRentMonth}.`;

      // Estimer la largeur et la hauteur du texte
      // Cela dépend de la police, de la taille de la police, et de la longueur du texte
      const textWidth = doc.widthOfString(text);
      const textHeight = doc.currentLineHeight();

      // Déterminer la position du texte
      // Pour l'alignement central, on démarre à la moitié de la largeur de la page moins la moitié de la largeur du texte
      const x = (doc.page.width - textWidth) / 2;
      const y = doc.y; // La position actuelle sur l'axe Y

      // Écrire le texte
      doc.text(text, { align: 'center' });

      // Dessiner le rectangle
      // Ajouter un peu d'espace autour du texte pour le cadre
      const padding = 10;
      doc.rect(x - padding, y - padding, textWidth + (padding * 2), textHeight + (padding * 2)).stroke();

      // Déplacer le curseur vers le bas après le texte et le rectangle
      doc.moveDown(2);

      // Property Address
      doc.fontSize(10).fillColor('black').text(`ADRESSE DE LA LOCATION :`);
      doc.fillColor('blue').text(fullAddress);
      doc.moveDown();

      // Landlord Declaration
      doc.fillColor('black').text(`Je soussigné `, { continued: true }).fillColor('blue').text(`${landlordFirstName} ${landlordLastName}`, { continued: true })
        .fillColor('black').text(`, propriétaire / bailleur du logement désigné ci-dessus, déclare avoir reçu de `, { continued: true })
        .fillColor('blue').text(`${tenantFirstName} ${tenantLastName}`, { continued: true })
        .fillColor('black').text(`, la somme de `, { continued: true })
        .fillColor('blue').text(`${totalInWords} EUROS`, { continued: true })
        .fillColor('black').text(` (en toutes lettres), `, { continued: true })
        .fillColor('blue').text(`${totalAmountInput} € `, { continued: true })
        .fillColor('black').text(`(en chiffres)`, { continued: true })
        .fillColor('black').text(`, au titre du paiement du loyer et des charges pour la période de location du `, { continued: true })
        .fillColor('blue').text(`${formattedRentalPeriodStart}`, { continued: true })
        .fillColor('black').text(` au `, { continued: true }).fillColor('blue').text(`${formattedRentalPeriodEnd}`, { continued: true })
        .fillColor('black').text(`, et lui en donne quittance, sous réserve de tous mes droits.`);
      doc.moveDown();

      // ...

      // Payment Details
      doc.fillColor('black').text(`DÉTAIL DU RÈGLEMENT :\n`);
      doc.text(`Loyer : `, { continued: true }).fillColor('blue').text(`${rentAmount} euros`).fillColor('black');
      if (formattedUtilitiesAmount !== null) {
        doc.text(`Provision pour charges : `, { continued: true }).fillColor('blue').text(`${formattedUtilitiesAmount} euros`).fillColor('black');
        doc.text(`Total : `, { continued: true }).fillColor('blue').text(`${totalAmountInput} euros`).fillColor('black');
      }
      doc.text(`Paiement reçu le: `, { continued: true }).fillColor('blue').text(`${formattedPaymentDate}`).fillColor('black');
      doc.moveDown();

      // Receipt Info
      doc.fillColor('black').text(`Fait à : `, { continued: true })
        .fillColor('blue').text(`${receiptLocation}`, { continued: true })
        .fillColor('black').text(`, le `, { continued: true })
        .fillColor('blue').text(`${formattedReceiptDate}`);
      // ...


      // Finalize the PDF and end the stream
      doc.end();

      // Send the PDF response
      ctx.body = fs.createReadStream('receipt.pdf');
      ctx.set('Content-Type', 'application/pdf');
      ctx.set('Content-Disposition', 'attachment; filename=receipt.pdf');

      return newReceipt;

    } catch (error) {
      console.error(error);
      return ctx.throw(400, error.toString());
    }
  },
};
