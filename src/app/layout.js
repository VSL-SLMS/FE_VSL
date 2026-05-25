import './globals.css';

export const metadata = {
  title: 'SLMS',
  description: 'Sign Language Learning Management System'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
