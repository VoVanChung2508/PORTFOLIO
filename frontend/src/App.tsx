import { useEffect, useState, type FormEvent } from 'react'
import { Mascot } from 'page-mascot'
import { api, type Banner } from './services/api'
import { aboutMe, education, profile, projects, skillGroups } from './content'

const fallbackBanner = 'Chào mừng bạn ghé thăm portfolio của mình. Cảm ơn bạn đã ở đây.'
const maxMessageLength = 1000

function BannerBar({ banner }: { banner: Banner }) {
  const text = banner.message.trim() || fallbackBanner
  return (
    <aside className="announcement" aria-label="Thông báo mới nhất">
      <span className="announcement-label"><span className="status-dot" /> NOTE</span>
      <div className="ticker" aria-live="polite">
        <div className="ticker-track">
          <span>{text}</span><span aria-hidden="true">{text}</span>
        </div>
      </div>
      <span className="announcement-index">01 / 01</span>
    </aside>
  )
}

function Header() {
  return (
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Về đầu trang"><span className="wordmark-mark">P.</span><span>PORTFOLIO<span className="wordmark-year"> / 2026</span></span></a>
      <nav aria-label="Điều hướng chính">
        <a href="#about">Giới thiệu</a><a href="#skills">Kỹ năng</a><a href="#projects">Dự án</a><a href="#contact">Liên hệ</a>
      </nav>
      <a className="header-availability" href="#contact">KẾT NỐI <span aria-hidden="true">↗</span></a>
    </header>
  )
}

function SectionHeading({ number, eyebrow, title, note }: { number: string; eyebrow: string; title: string; note?: string }) {
  return (
    <div className="section-heading">
      <div><span className="section-kicker"><span>{number}</span> / {eyebrow}</span><h2>{title}</h2></div>
      {note && <p>{note}</p>}
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setStatus(null)
    try {
      const result = await api.sendMessage(name, message)
      setStatus({ kind: 'success', text: result.message })
      setName('')
      setMessage('')
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Không gửi được thông điệp.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="message-form" onSubmit={submit}>
      <label htmlFor="visitor-name">Tên của bạn <span>(không bắt buộc)</span></label>
      <input id="visitor-name" name="name" autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Bạn tên gì?" />
      <div className="label-row"><label htmlFor="visitor-message">Lời nhắn <span className="required-mark">*</span></label><span className="field-count">{message.length} / {maxMessageLength}</span></div>
      <textarea id="visitor-message" name="message" required minLength={1} maxLength={maxMessageLength} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Viết vài dòng cho mình..." />
      {status && <p className={`form-status ${status.kind}`} role="status">{status.text}</p>}
      <button className="button button-primary submit-button" type="submit" disabled={submitting || !message.trim()}>{submitting ? 'Đang gửi…' : 'Gửi lời nhắn'} <span aria-hidden="true">↗</span></button>
      <p className="form-footnote">Thông điệp sẽ được gửi riêng đến chủ website.</p>
    </form>
  )
}

function ContactLinks() {
  const links = [
    profile.email && { label: 'Email', value: profile.email, href: `mailto:${profile.email}` },
    profile.github && { label: 'GitHub', value: profile.github.replace(/^https?:\/\/(www\.)?/, ''), href: profile.github },
    profile.linkedin && { label: 'LinkedIn', value: profile.linkedin.replace(/^https?:\/\/(www\.)?/, ''), href: profile.linkedin },
    profile.instagram && { label: 'Instagram', value: profile.instagram.replace(/^https?:\/\/(www\.)?/, ''), href: profile.instagram },
    profile.facebook && { label: 'Facebook', value: profile.facebook.replace(/^https?:\/\/(www\.)?/, ''), href: profile.facebook },
  ].filter((link): link is { label: string; value: string; href: string } => Boolean(link))

  return links.length ? <div className="contact-links">{links.map((link) => <a key={link.label} href={link.href} target={link.href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><span>{link.label}</span><span>{link.value} ↗</span></a>)}</div> : <p className="empty-note">Thông tin liên hệ chưa được công khai.</p>
}

function Portfolio() {
  const [banner, setBanner] = useState<Banner>({ message: '', updatedAt: null })
  const [mascotBlocked, setMascotBlocked] = useState(false)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const current = await api.getBanner()
        if (active) setBanner(current)
      } catch {
        // Keep the fallback announcement when the API is temporarily unavailable.
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    const mascot = document.querySelector('.portfolio-mascot')
    const targets = [document.querySelector('.hero-actions'), document.querySelector('.form-panel')]
      .filter((target): target is Element => target !== null)
    if (!mascot || !targets.length || !('IntersectionObserver' in window)) return
    const visibleTargets = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleTargets.add(entry.target)
        else visibleTargets.delete(entry.target)
      })
      const mascotRect = mascot.getBoundingClientRect()
      const overlapsContent = [...visibleTargets].some((target) => {
        const targetRect = target.getBoundingClientRect()
        return targetRect.left < mascotRect.right && targetRect.right > mascotRect.left
          && targetRect.top < mascotRect.bottom && targetRect.bottom > mascotRect.top
      })
      setMascotBlocked(overlapsContent)
    }, { threshold: 0.12 })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <BannerBar banner={banner} />
      <Header />
      <main id="home">
        <section className="hero page-wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-eyebrow"><span className="live-mark" /> SINH VIÊN CÔNG NGHỆ <span className="hero-location">{profile.location ? `· ${profile.location}` : '· PORTFOLIO CÁ NHÂN'}</span></p>
            <h1 id="hero-title">Xin chào,<br />mình là <span>{profile.name}</span><i>.</i></h1>
            <p className="hero-lead">{profile.role} <span className="hero-separator">/</span> {profile.major}</p>
            <p className="hero-description">Mình đang xây dựng nền tảng vững chắc trong công nghệ và biến những điều đang học thành sản phẩm hữu ích. Đây là nơi mình ghi lại hành trình đó.</p>
            <div className="hero-actions"><a className="button button-primary" href="#projects">Xem dự án <span aria-hidden="true">↘</span></a><a className="button button-quiet" href="#contact">Liên hệ <span aria-hidden="true">↗</span></a></div>
            <div className="hero-meta"><span>01 — 06</span><span>ĐANG HỌC · ĐANG LÀM</span><span>SCROLL ĐỂ KHÁM PHÁ <span aria-hidden="true">↓</span></span></div>
          </div>
          <div className="hero-visual" aria-label="Ảnh đại diện của chủ portfolio">
            <div className="portrait-frame"><div className="portrait-grid" /><div className="portrait-orbit orbit-one" /><div className="portrait-orbit orbit-two" /><span className="portrait-initials">YN</span><span className="portrait-caption">YOUR<br />PHOTO</span><span className="portrait-corner corner-tl" /><span className="portrait-corner corner-br" /></div>
            <div className="visual-note"><span className="visual-note-index">FIG. 01</span><span>ĐANG TRONG QUÁ TRÌNH<br />HOÀN THIỆN</span></div>
            <div className="visual-coordinate">{profile.location || 'LOCATION / YOURS'}</div>
          </div>
          <div className="hero-side-label">HỌC HỎI · THỬ NGHIỆM · PHÁT TRIỂN</div>
        </section>

        <section id="about" className="section page-wrap about-section">
          <SectionHeading number="01" eyebrow="ABOUT ME" title="Tò mò có chủ đích." note="Mình tin rằng hiểu cách mọi thứ vận hành là bước đầu tiên để tạo ra thứ gì đó tốt hơn." />
          <div className="about-grid"><p className="about-statement">Không chỉ học cách <em>viết code.</em><br />Mình muốn hiểu cả hệ thống<br />đằng sau nó.</p><div className="about-copy"><p>{aboutMe.introduction}</p><p>{aboutMe.direction}</p><div className="learning-row"><span className="learning-label">ĐANG KHÁM PHÁ</span>{aboutMe.focusAreas.map((area) => <span key={area}>{area}</span>)}</div></div></div>
        </section>

        <section id="skills" className="section skills-section"><div className="page-wrap"><SectionHeading number="02" eyebrow="TOOLKIT" title="Đang tích lũy từng ngày." /><div className="skills-grid">{skillGroups.map((group, index) => <article className="skill-group" key={group.title}><div className="skill-group-top"><span className="skill-icon" aria-hidden="true">{group.icon}</span><span className="skill-number">0{index + 1}</span></div><h3>{group.title}</h3><div className="skill-tags">{group.skills.length ? group.skills.map((skill) => <span key={skill}>{skill}</span>) : <span className="skill-placeholder">Chưa cập nhật</span>}</div></article>)}</div></div></section>

        <section id="projects" className="section page-wrap projects-section"><SectionHeading number="03" eyebrow="SELECTED WORK" title="Những thứ mình làm." />{projects.length ? <div className="projects-grid">{projects.map((project) => <article className="project-card" key={project.name}><div className="project-art">{project.image ? <img src={project.image} alt={`Ảnh minh họa ${project.name}`} /> : <span aria-hidden="true">{project.name.slice(0, 2).toUpperCase()}</span>}</div><div className="project-content"><span className="project-index">PROJECT / {String(projects.indexOf(project) + 1).padStart(2, '0')}</span><h3>{project.name}</h3><p>{project.description}</p><div className="project-tags">{project.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div><div className="project-links">{project.github && <a href={project.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Live demo ↗</a>}</div></div></article>)}</div> : <div className="projects-empty"><span className="empty-cross">＋</span><div><span className="project-index">WORK IN PROGRESS</span><p>Dự án đầu tiên sẽ xuất hiện ở đây.</p></div><span className="empty-count">00 / 00</span></div>}</section>

        <section id="education" className="section education-section"><div className="page-wrap"><SectionHeading number="04" eyebrow="EDUCATION" title="Nền tảng đang hình thành." /><div className="education-list">{education.length ? education.map((item) => <article className="education-item" key={`${item.school}-${item.major}`}><span className="education-period">{item.period || 'ĐANG HỌC'}</span><div><h3>{item.school}</h3><p>{item.major}</p>{item.details?.map((detail) => <span className="education-detail" key={detail}>{detail}</span>)}</div><span className="education-arrow" aria-hidden="true">↗</span></article>) : <p className="empty-note">Thông tin học vấn chưa được cập nhật.</p>}</div></div></section>

        <section id="contact" className="section page-wrap contact-section"><SectionHeading number="05" eyebrow="SAY HELLO" title="Cùng bắt đầu một cuộc trò chuyện." note="Một câu hỏi, một ý tưởng hay đơn giản là lời chào, mình đều muốn nghe." /><div className="contact-grid"><div className="contact-details"><p className="contact-invite">Bạn đang làm điều gì thú vị?<br /><span>Mình cũng muốn biết.</span></p><ContactLinks />{profile.availability && <p className="availability-note"><span className="status-dot" /> {profile.availability}</p>}</div><div className="form-panel"><div className="form-panel-heading"><span>DROP A NOTE</span><span>↘</span></div><ContactForm /></div></div></section>
      </main>
      <footer className="site-footer page-wrap"><a className="wordmark" href="#home"><span className="wordmark-mark">P.</span><span>PORTFOLIO</span></a><span>ĐƯỢC THIẾT KẾ & XÂY DỰNG CẨN THẬN</span><a href="/admin">ADMIN ↗</a><span>© 2026</span></footer>
      <Mascot directions="/mascots/raccoon-directions.webp" reactions="/mascots/raccoon-reactions.webp" size={128} label="Gấu mèo tương tác" className={`portfolio-mascot${mascotBlocked ? ' mascot-obscured' : ''}`} />
    </>
  )
}

function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('portfolio-admin-token') || '')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const result = await api.updateBanner(token, message)
      sessionStorage.setItem('portfolio-admin-token', token)
      setStatus({ kind: 'success', text: `Đã cập nhật lúc ${new Date(result.updatedAt || Date.now()).toLocaleTimeString('vi-VN')}.` })
    } catch (error) {
      if ('status' in (error as object) && (error as { status?: number }).status === 401) {
        sessionStorage.removeItem('portfolio-admin-token')
      }
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Không thể cập nhật banner.' })
    } finally {
      setSaving(false)
    }
  }

  return <main className="admin-page"><a className="wordmark admin-wordmark" href="/"><span className="wordmark-mark">P.</span><span>PORTFOLIO</span></a><section className="admin-panel"><span className="section-kicker">PRIVATE / CONTENT CONTROL</span><h1>Cập nhật<br />lời nhắn.</h1><p className="admin-intro">Nội dung mới sẽ hiển thị trên portfolio sau lần đồng bộ tiếp theo.</p><form className="admin-form" onSubmit={submit}><label htmlFor="admin-token">Mã quản trị</label><input id="admin-token" type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} required minLength={32} placeholder="Dán ADMIN_TOKEN (ít nhất 32 ký tự)" /><label htmlFor="banner-message">Lời nhắn trên banner</label><textarea id="banner-message" value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={180} rows={4} placeholder="Viết thông báo ngắn..." /><div className="admin-count">{message.length} / 180 ký tự</div>{status && <p className={`form-status ${status.kind}`} role="status">{status.text}</p>}<button className="button button-primary" type="submit" disabled={saving || !message.trim()}>{saving ? 'Đang lưu…' : 'Cập nhật banner'} <span aria-hidden="true">↗</span></button></form><p className="admin-security">Mã chỉ được lưu trong bộ nhớ phiên trình duyệt sau lần xác thực thành công.</p></section><a className="admin-back" href="/">← Quay lại portfolio</a></main>
}

export default function App() {
  const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin'
  useEffect(() => { document.title = isAdmin ? 'Quản trị banner | Portfolio' : `Portfolio | ${profile.name}` }, [isAdmin])
  return isAdmin ? <AdminPage /> : <Portfolio />
}
