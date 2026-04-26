import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrapRoyaltiesPro — Real catalog cleaning. Real data. Real financial impact.',
  description: 'You\'re getting streams. Are you getting paid? Free catalog scan. Forensic metadata cleaning for artists, publishers, attorneys, and catalog owners.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
