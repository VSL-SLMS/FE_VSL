import './globals.css';
import ToastProvider from './components/ToastProvider';

export const metadata = {
  title: 'SLMS',
  description: 'Sign Language Learning Management System'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
