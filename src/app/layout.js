import './globals.css';
import ToastProvider from './components/ToastProvider';

export const metadata = {
  title: 'SignLearn - SLMS',
  description: 'A friendly and structured Vietnamese Sign Language Learning Management System.',
  openGraph: {
    title: 'SignLearn - SLMS',
    description: 'Learn Vietnamese Sign Language with bite-sized lessons, book mode, and structured sign cards.',
    url: 'https://signlearn.example.com',
    siteName: 'SignLearn',
    locale: 'vi_VN',
    type: 'website',
  },
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
