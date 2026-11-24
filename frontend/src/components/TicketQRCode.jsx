/**
 * frontend/src/components/TicketQRCode.jsx
 * Renders a scannable digital QR pass for confirmed UtsavVerse bookings.
 */

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export const buildTicketQRPayload = (booking) =>
  JSON.stringify({
    platform: 'UtsavVerse',
    bookingCode: booking.bookingCode,
    bookingId: booking._id,
    eventId: booking.eventId,
    eventTitle: booking.eventTitle,
    attendee: booking.userName,
    tier: booking.ticketCategoryName,
    quantity: booking.quantity,
    status: booking.bookingStatus,
  });

export default function TicketQRCode({ booking, size = 148 }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!booking?.bookingCode) return undefined;

    QRCode.toDataURL(buildTicketQRPayload(booking), {
      width: size * 2,
      margin: 2,
      color: {
        dark: '#131122',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });

    return () => {
      active = false;
    };
  }, [booking, size]);

  if (!booking) return null;

  return (
    <div
      className="d-flex flex-column align-items-center text-center p-3"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--ev-border)',
        borderRadius: 'var(--ev-radius-md)',
      }}
    >
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`Digital QR pass for ${booking.bookingCode}`}
          width={size}
          height={size}
          style={{ display: 'block', borderRadius: '6px' }}
        />
      ) : (
        <div
          style={{ width: size, height: size, backgroundColor: 'var(--ev-bg-light)' }}
          className="d-flex align-items-center justify-content-center small text-muted"
        >
          Generating QR...
        </div>
      )}
      <div className="ev-mono fw-bold small mt-2" style={{ color: 'var(--ev-primary)' }}>
        {booking.bookingCode}
      </div>
      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
        Scan at venue entry gate
      </div>
    </div>
  );
}
