import Link from 'next/link';
import { HomeNav } from './components/Nav';
import { fetchApi } from '../lib/api';
import Image from 'next/image';

async function getOverview() {
  const response = await fetchApi('/course-overview');
  return response.data.parts || [];
}

export default async function Home() {
  const parts = await getOverview();
  const chapterCount = parts.reduce((total, part) => total + (part.chapters?.length || 0), 0);
  const lessonCount = parts.reduce(
    (total, part) => total + (part.chapters || []).reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0),
    0
  );

  return (
    <>
      <HomeNav />
      <main>
        <section className="hero">
          <div className="hero-inner">
            <div>
              <span className="pill">● Vietnamese Sign Language · Level 1 to conversation</span>
              <h1>Learn to sign, connect hearts 💛</h1>
              <p>
                A friendly way to learn Vietnamese Sign Language with bite-sized lessons, book mode, structured sign
                cards, teacher workflows, grading, appeals, and progress tracking.
              </p>
              <div className="actions">
                <Link className="btn btn-primary" href="/register">Start learning</Link>
                <Link className="btn" href="/lessons">Explore lessons</Link>
              </div>
              <div className="social-proof">
                <div className="avatar-stack">
                  {['var(--orange)', 'var(--primary)', 'var(--pink)', 'var(--yellow)'].map((color) => (
                    <span className="avatar-dot" style={{ background: color }} key={color} />
                  ))}
                </div>
                <span><strong>{lessonCount || 28}</strong> VSL lessons</span>
                <span>★ 4.9 / 5 learner experience</span>
              </div>
            </div>
            <div className="hero-media">
              <div className="hero-photo">
                <Image src="/assets/hero-vsl.jpg" alt="Children learning sign language" width={400} height={300} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
              </div>
              <div className="floating-note">
                <span className="brand-mark" style={{ background: 'var(--yellow)', color: 'var(--text)' }}>🎉</span>
                <div>
                  <strong>Lesson complete</strong>
                  <div className="muted">+50 XP earned</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section split">
          <Image className="illustration" src="/assets/illus-hand.png" alt="Friendly hand illustration" width={300} height={300} />
          <div>
            <span className="eyebrow">What is VSL?</span>
            <h2>Vietnamese Sign Language</h2>
            <p className="lead">
              Vietnamese Sign Language is a natural visual language used by the Deaf community in Vietnam. This LMS turns
              existing VSL curriculum data into a guided digital learning experience.
            </p>
            <div className="stack">
              {['A complete language with its own grammar', 'Book mode from original PDF pages', 'Learn mode with sign vocabulary cards'].map((item) => (
                <div className="card" style={{ boxShadow: 'none' }} key={item}>✓ {item}</div>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="section-band">
          <div className="section">
            <div className="center">
              <span className="eyebrow">Why learn VSL</span>
              <h2>More than a language, it is a bridge</h2>
            </div>
            <div className="feature-grid">
              {[
                ['💗', 'Connect deeply', 'Communicate with Deaf friends, learners, families, and communities.'],
                ['🌏', 'Build inclusion', 'Make classrooms, services, and everyday spaces more accessible.'],
                ['🎓', 'Learn with structure', 'Track lessons, assignments, feedback, appeals, and final results.']
              ].map(([icon, title, body]) => (
                <article className="card" key={title}>
                  <div style={{ fontSize: 32 }}>{icon}</div>
                  <h3>{title}</h3>
                  <p className="muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="who" className="section split">
          <div>
            <span className="eyebrow">Who is it for</span>
            <h2>Made for everyone curious</h2>
            <p className="lead">Students, parents, teachers, healthcare staff, and anyone who wants to learn VSL from the first sign.</p>
            <div className="role-grid">
              {[
                ['🧒', 'Students', 'Lessons, progress, assignments, feedback.'],
                ['👩‍🏫', 'Teachers', 'Assigned students, grading, appeals, accuracy.'],
                ['🛡', 'Admins', 'Users, lessons, escalations, audit logs.']
              ].map(([icon, title, body]) => (
                <div className="card" style={{ boxShadow: 'none' }} key={title}>
                  <div style={{ fontSize: 28 }}>{icon}</div>
                  <strong>{title}</strong>
                  <p className="muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <Image className="illustration" src="/assets/illus-friends.png" alt="Friends connecting" width={300} height={300} />
        </section>

        <section className="section">
          <div className="card" style={{ background: 'var(--primary)', color: 'white', overflow: 'hidden' }}>
            <div className="split">
              <div>
                <h2>Ready to sign your first word?</h2>
                <p style={{ opacity: 0.9 }}>Free to start. Pick a teacher. Begin today.</p>
                <div className="actions">
                  <Link className="btn" href="/register">Create account</Link>
                  <Link className="btn btn-dark" href="/lessons">Explore lessons</Link>
                </div>
              </div>
              <Image className="illustration" src="/assets/illus-grad.png" alt="" width={300} height={300} />
            </div>
          </div>
        </section>

        <footer className="footer">
          © 2026 SignLearn · Frontend UI powered by Next.js · Backend API powered by Express + MySQL
        </footer>
      </main>
    </>
  );
}
