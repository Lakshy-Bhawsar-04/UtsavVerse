/**
 * src/services/pdfTicket.js
 * Generates a downloadable, print-ready PDF E-Ticket with embedded scannable QR code using jsPDF & qrcode.
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { formatEventDate } from '../data/eventsData';
import { buildTicketQRPayload } from '../components/TicketQRCode';

export const downloadBookingTicketPDF = async (booking) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header band
  doc.setFillColor(108, 59, 255); // #6C3BFF
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('UtsavVerse', 18, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('OFFICIAL DIGITAL E-TICKET', 18, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(booking.bookingCode || 'EVT-PASS', 192, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`STATUS: ${String(booking.bookingStatus || 'CONFIRMED').toUpperCase()}`, 192, 29, {
    align: 'right',
  });

  // Event Title
  doc.setTextColor(19, 17, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(booking.eventTitle || 'Event Pass', 174);
  doc.text(titleLines, 18, 58);

  const yOffset = 58 + titleLines.length * 7 + 4;

  // Divider
  doc.setDrawColor(231, 228, 242);
  doc.line(18, yOffset, 192, yOffset);

  // Details Grid
  doc.setFontSize(10);
  const rows = [
    ['Attendee Name', booking.userName],
    ['Attendee Email', booking.userEmail],
    ['Event Date & Time', `${formatEventDate(booking.eventDate)} · ${booking.eventTime || 'IST'}`],
    ['Venue & City', `${booking.eventVenue}, ${booking.eventCity}`],
    ['Ticket Category', booking.ticketCategoryName],
    ['Quantity', `${booking.quantity} Ticket(s)`],
    ['Unit Price', `INR ${Number(booking.unitPrice).toLocaleString('en-IN')}`],
    ['Platform Fee', `INR ${Number(booking.convenienceFee || 0).toLocaleString('en-IN')}`],
    ['Total Paid', `INR ${Number(booking.totalAmount).toLocaleString('en-IN')}`],
    ['Payment Reference', booking.razorpayPaymentId || booking.razorpayOrderId || 'Verified'],
  ];

  let y = yOffset + 12;
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(111, 107, 133);
    doc.text(label, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(19, 17, 34);
    doc.text(String(value || '-'), 75, y);
    y += 10;
  });

  // Verification & Digital QR Box
  const boxY = y + 6;
  doc.setFillColor(247, 246, 251);
  doc.roundedRect(18, boxY, 174, 48, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(108, 59, 255);
  doc.text('DIGITAL QR ENTRY PASS', 24, boxY + 14);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(19, 17, 34);
  doc.text(`${booking.bookingCode}`, 24, boxY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(111, 107, 133);
  doc.text(`Ref: ${String(booking._id).slice(-8).toUpperCase()}`, 24, boxY + 32);
  doc.text('Scan QR code at venue check-in desk', 24, boxY + 39);

  try {
    const qrDataUrl = await QRCode.toDataURL(buildTicketQRPayload(booking), {
      width: 240,
      margin: 1,
      color: { dark: '#131122', light: '#FFFFFF' },
    });
    doc.addImage(qrDataUrl, 'PNG', 146, boxY + 4, 40, 40);
  } catch {
    // Fallback silently if QR fails
  }

  // Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(111, 107, 133);
  doc.text(
    'Present this digital pass at the venue entry gate along with a valid government-issued photo ID.',
    18,
    272
  );
  doc.text('UtsavVerse Platform — Curated by Lakshy Bhawsar', 18, 278);

  doc.save(`${booking.bookingCode || 'UtsavVerse-Ticket'}.pdf`);
};
