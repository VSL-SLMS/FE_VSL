'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Nav from '../components/Nav';
import { createPaymentAction, getPricingAction } from '../actions/payment';
import toast from 'react-hot-toast';
import { readStoredUser } from '../../lib/authStorage';

export default function PaymentPricingPage() {
  const router = useRouter();
  const [pricing, setPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [user] = useState(() => readStoredUser('STUDENT'));

  useEffect(() => {
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent('/payment')}`);
    }
  }, [router, user]);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await getPricingAction();
        if (res.success) {
          setPricing(res.data);
        } else {
          toast.error(res.message || 'Không thể tải thông tin giá khóa học.');
        }
      } catch (err) {
        toast.error('Lỗi kết nối đến máy chủ.');
      } finally {
        setLoadingPricing(false);
      }
    }
    fetchPricing();
  }, []);

  async function handlePayment() {
    if (!user) {
      toast.error('Vui lòng đăng nhập tài khoản học viên để thực hiện thanh toán.');
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent('/payment')}`);
      }, 1500);
      return;
    }

    setCheckingOut(true);
    try {
      const res = await createPaymentAction(user.token);
      if (res.success && res.data?.alreadyPurchased) {
        toast.success('Tài khoản đã có quyền truy cập khóa học.');
        router.push('/student/lessons');
        return;
      }
      if (res.success && res.data?.paymentUrl) {
        toast.success('Đang chuyển hướng sang cổng thanh toán VNPay...');
        window.location.assign(res.data.paymentUrl);
      } else {
        toast.error(res.message || 'Khởi tạo thanh toán thất bại.');
        setCheckingOut(false);
      }
    } catch (err) {
      toast.error('Lỗi khởi tạo giao dịch.');
      setCheckingOut(false);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  return (
    <>
      <Nav />
      <main className="page" style={{ maxWidth: 860 }}>
        {!user ? (
          <div className="card center stack" style={{ padding: '60px 24px', marginTop: 60 }}>
            <h1>Login required</h1>
            <p className="muted">Please log in with a Student account before purchasing the course.</p>
            <Link href={`/login?redirect=${encodeURIComponent('/payment')}`} className="btn btn-primary">
              Log in to continue
            </Link>
          </div>
        ) : (
          <>
        <div className="center" style={{ margin: '40px 0 20px' }}>
          <span className="eyebrow">Cổng Thanh Toán</span>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '12px 0' }}>Mở Khóa Toàn Bộ Khóa Học</h1>
          <p className="lead" style={{ maxWidth: 600, margin: '0 auto' }}>
            Học Ngôn ngữ Ký hiệu Việt Nam một cách bài bản nhất từ cơ bản đến nâng cao.
          </p>
        </div>

        {loadingPricing ? (
          <div className="card center" style={{ padding: '60px 20px' }}>
            <p className="muted">Đang tải thông tin khóa học...</p>
          </div>
        ) : !pricing ? (
          <div className="card center" style={{ padding: '60px 20px' }}>
            <p className="muted">Không có thông tin giá khóa học hoạt động.</p>
          </div>
        ) : (
          <div className="split" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', alignItems: 'stretch', gap: 32, marginTop: 40 }}>
            <div className="card stack" style={{ justifyContent: 'center' }}>
              <span className="eyebrow" style={{ color: 'var(--success)' }}>Thông Tin Khóa Học</span>
              <h2 style={{ fontSize: 24, margin: '4px 0 12px' }}>{pricing.title}</h2>
              <p className="muted" style={{ lineHeight: 1.6 }}>{pricing.description}</p>

              <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />

              <div className="stack" style={{ gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                  <span>Trọn bộ 28 bài học phân bổ trực quan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                  <span>Chế độ học tương tác (Learn Mode) & sách giáo khoa (Book Mode)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                  <span>Sở hữu trọn đời - không phát sinh phí duy trì</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                  <span>Chỉ định và tương tác với Giáo viên hướng dẫn</span>
                </div>
              </div>
            </div>

            <div className="card stack center" style={{ borderColor: 'var(--primary)', borderWeight: 2, background: 'color-mix(in oklch, var(--accent) 30%, white)', justifyContent: 'space-between', padding: 32 }}>
              <div className="stack" style={{ gap: 8 }}>
                <span className="eyebrow">Học Phí Trọn Gói</span>
                {pricing.discount_price_vnd ? (
                  <div className="stack" style={{ gap: 4 }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: 18 }}>
                      {formatCurrency(pricing.price_vnd)}
                    </span>
                    <strong style={{ fontSize: 36, color: 'var(--primary-dark)' }}>
                      {formatCurrency(pricing.discount_price_vnd)}
                    </strong>
                  </div>
                ) : (
                  <strong style={{ fontSize: 36, color: 'var(--primary-dark)', margin: '8px 0' }}>
                    {formatCurrency(pricing.price_vnd)}
                  </strong>
                )}
                <span className="pill" style={{ margin: '0 auto' }}>Thanh toán một lần</span>
              </div>

              <div className="stack" style={{ gap: 16, marginTop: 24 }}>
                <button
                  className="btn btn-primary"
                  onClick={handlePayment}
                  disabled={checkingOut}
                  style={{ width: '100%', minHeight: 48, fontSize: 16 }}
                >
                  {checkingOut ? 'Đang khởi tạo VNPay...' : 'Thanh toán qua VNPay'}
                </button>
                <p className="muted" style={{ fontSize: 12 }}>
                  Bằng việc thanh toán, bạn đồng ý với các Điều khoản dịch vụ và Chính sách của SignLearn.
                </p>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </>
  );
}
