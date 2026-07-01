'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Nav from '../../components/Nav';
import { verifyPaymentAction } from '../../actions/payment';

function PaymentResultInner() {
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function verify() {
      // Build a simple object from query parameters
      const paramsObj = {};
      searchParams.forEach((value, key) => {
        paramsObj[key] = value;
      });

      if (Object.keys(paramsObj).length === 0) {
        queueMicrotask(() => {
          setResult({
            success: false,
            message: 'Không tìm thấy tham số giao dịch thanh toán.'
          });
          setVerifying(false);
        });
        return;
      }

      try {
        const res = await verifyPaymentAction(paramsObj);
        if (res.success) {
          setResult(res.data);
        } else {
          setResult({
            success: false,
            message: res.message || 'Xác thực giao dịch thanh toán thất bại.'
          });
        }
      } catch (err) {
        setResult({
          success: false,
          message: 'Không thể kết nối đến máy chủ để xác thực giao dịch.'
        });
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, [searchParams]);

  function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  if (verifying) {
    return (
      <div className="card center stack" style={{ padding: '60px 20px', maxWidth: 500, margin: '60px auto' }}>
        <div className="center" style={{ margin: '0 auto' }}>
          <span style={{ fontSize: 48 }}>⌛</span>
        </div>
        <h2>Đang xác thực giao dịch...</h2>
        <p className="muted">Vui lòng không tắt hoặc tải lại trang này.</p>
      </div>
    );
  }

  const isSuccess = result?.success;

  return (
    <div className="card center stack" style={{ padding: '40px 32px', maxWidth: 500, margin: '60px auto', borderTop: `6px solid ${isSuccess ? 'var(--success)' : 'var(--danger)'}` }}>
      <div className="center" style={{ margin: '0 auto' }}>
        <span style={{ fontSize: 64 }}>{isSuccess ? '✅' : '❌'}</span>
      </div>

      <h2 style={{ fontSize: 24, margin: '12px 0 6px' }}>
        {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
      </h2>
      <p className="muted" style={{ lineHeight: 1.6 }}>
        {isSuccess
          ? 'Tài khoản của bạn đã được nâng cấp quyền truy cập trọn đời cho khóa học.'
          : (result?.message || 'Giao dịch của bạn đã bị hủy hoặc không thành công.')}
      </p>

      {result?.txnRef && (
        <div className="stack" style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, margin: '16px 0', fontSize: 14, textAlign: 'left', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Mã giao dịch:</span>
            <strong style={{ fontFamily: 'monospace' }}>{result.txnRef}</strong>
          </div>
          {result?.amount && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Số tiền đã trả:</span>
              <strong>{formatCurrency(result.amount)}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Cổng thanh toán:</span>
            <strong>VNPay Sandbox</strong>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {isSuccess ? (
          <Link href="/student/lessons" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
            Bắt đầu học ngay
          </Link>
        ) : (
          <Link href="/payment" className="btn btn-primary" style={{ width: '100%', minHeight: 46 }}>
            Thử thanh toán lại
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <>
      <Nav />
      <main className="page">
        <Suspense fallback={
          <div className="card center stack" style={{ padding: '60px 20px', maxWidth: 500, margin: '60px auto' }}>
            <h2>Đang tải thông tin...</h2>
          </div>
        }>
          <PaymentResultInner />
        </Suspense>
      </main>
    </>
  );
}
