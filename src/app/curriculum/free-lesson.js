import Link from 'next/link';
import Image from 'next/image';
import { HomeNav } from '../components/Nav';
import { backendAssetUrl, fetchApi } from '../../lib/api';

const FREE_LESSON_SLUG = 'su-xuat-hien-nnkh';
const FREE_LESSON_PATH = '/curriculum/su-xuat-hien-ngon-ngu-ky-hieu';
const FALLBACK_LESSON = {
  title: 'Sự xuất hiện Ngôn ngữ Kí hiệu',
  slug: FREE_LESSON_SLUG,
  lesson_type: 'theory',
  estimated_minutes: 15,
  part_title: 'Phần 1: Ngôn ngữ ký hiệu Việt Nam',
  chapter_title: 'Khái quát chung về Ngôn ngữ kí hiệu'
};
const FALLBACK_PAGES = [7, 8, 9].map((pageNumber) => ({
  id: `fallback-${pageNumber}`,
  page_number: pageNumber,
  image_path: `/images/pages_hires/page_${String(pageNumber).padStart(4, '0')}.png`
}));
const LESSON_POINTS = [
  'Hiểu vì sao Ngôn ngữ Kí hiệu xuất hiện như một nhu cầu giao tiếp tự nhiên của cộng đồng người Điếc.',
  'Nắm được vai trò của cử chỉ, nét mặt, hướng nhìn và không gian trong giao tiếp bằng kí hiệu.',
  'Phân biệt cách học nội dung lý thuyết trong Book mode với các bài kí hiệu thực hành ở những chương sau.'
];

async function getCurriculum() {
  try {
    const response = await fetchApi('/course-overview');
    return response.data.parts || [];
  } catch {
    return [];
  }
}

function findFreeLesson(parts) {
  for (const part of parts) {
    for (const chapter of part.chapters || []) {
      const match = (chapter.lessons || []).find((lesson) => lesson.slug === FREE_LESSON_SLUG);
      if (match) return { ...match, part, chapter };
    }
  }

  return null;
}

export default async function FreeCurriculumLessonPage() {
  const parts = await getCurriculum();
  const freeLesson = findFreeLesson(parts);
  const lesson = freeLesson || FALLBACK_LESSON;
  const pages = FALLBACK_PAGES;

  return (
    <>
      <HomeNav />
      <main className="page">
        <header className="page-head free-lesson-head">
          <div>
            <Link className="muted" href="/curriculum">Curriculum</Link>
            <span className="eyebrow">Free guest lesson</span>
            <h1>{lesson.title}</h1>
            <p>
              {lesson.part_title || freeLesson?.part?.title} / {lesson.chapter_title || freeLesson?.chapter?.title}
              {' '}· {lesson.estimated_minutes || 15} min
            </p>
          </div>
          <div className="actions">
            <Link className="btn" href="/login">Login</Link>
            <Link className="btn btn-primary" href="/register">Register as student</Link>
          </div>
        </header>

        <div className="lesson-detail">
          <section className="stack">
            <div className="card free-lesson-intro">
              <span className="pill">Unlocked for guests</span>
              <h2>Bạn có thể học trọn bài mẫu này</h2>
              <p className="muted">
                Đây là bài học đầu tiên được mở công khai để Guest hiểu cách hệ thống trình bày nội dung. Các bài tiếp
                theo yêu cầu đăng nhập để xem đầy đủ, theo dõi tiến độ và làm bài tập.
              </p>
            </div>

            <div className="card stack lesson-reader-section">
              <h2>Nội dung chính</h2>
              <div className="lesson-article">
                <p>
                  Bài học giới thiệu bối cảnh hình thành Ngôn ngữ Kí hiệu và cách cộng đồng người Điếc sử dụng hệ thống
                  kí hiệu thị giác để giao tiếp, học tập và kết nối xã hội.
                </p>
                <blockquote>
                  Guest được xem đầy đủ bài mẫu này; các bài còn lại sẽ được mở sau khi đăng nhập tài khoản Student.
                </blockquote>
                <div className="lesson-point-grid">
                  {LESSON_POINTS.map((point) => (
                    <div className="outcome-pill" key={point}>
                      <span>✓</span>
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="card stack">
              <div>
                <span className="eyebrow">Book mode</span>
                <h2>Trang tài liệu của bài học</h2>
                <p className="muted">Guest có thể xem đầy đủ các trang của bài học mẫu này.</p>
              </div>

              <div className="book-grid">
                {pages.map((page) => (
                  <article className="book-page" key={page.id}>
                    <span className="pill">Page {page.page_number}</span>
                    <Image
                      src={backendAssetUrl(page.image_path)}
                      alt={`Page ${page.page_number}`}
                      width={900}
                      height={1200}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="card sidebar-card">
            <span className="eyebrow">Continue learning</span>
            <div className="stack" style={{ marginTop: 16 }}>
              <Link className="btn btn-primary" href={`/login?redirect=${encodeURIComponent(`/lessons/${lesson.slug}`)}`}>
                Login for all lessons
              </Link>
              <Link className="btn" href="/curriculum">Back to curriculum</Link>
              <Link className="btn" href={FREE_LESSON_PATH}>Share lesson link</Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

export { FREE_LESSON_PATH, FREE_LESSON_SLUG };
