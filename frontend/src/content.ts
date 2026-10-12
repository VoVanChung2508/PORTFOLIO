export const profile = {
  name: import.meta.env.VITE_PORTFOLIO_NAME || 'Võ Văn Chung',
  role: import.meta.env.VITE_PORTFOLIO_ROLE || 'Sinh viên',
  major: import.meta.env.VITE_PORTFOLIO_MAJOR || 'Kỹ thuật phần mềm',
  email: import.meta.env.VITE_PORTFOLIO_EMAIL || 'vovanchung357@gmail.com',
  github: import.meta.env.VITE_PORTFOLIO_GITHUB || 'https://github.com/VoVanChung2508',
  linkedin: import.meta.env.VITE_PORTFOLIO_LINKEDIN || 'https://www.linkedin.com/in/vovan-chung',
  instagram: import.meta.env.VITE_PORTFOLIO_INSTAGRAM || 'https://instagram.com/vanchung.dev',
  facebook: import.meta.env.VITE_PORTFOLIO_FACEBOOK || 'https://facebook.com/vovanchung2508',
  location: import.meta.env.VITE_PORTFOLIO_LOCATION || 'Việt Nam',
  availability: import.meta.env.VITE_PORTFOLIO_AVAILABILITY || 'Sẵn sàng cho thực tập, dự án cộng đồng và hợp tác phát triển web',
}

export const skillGroups = [
  { title: 'Programming', icon: '</>', skills: ['TypeScript', 'JavaScript', 'Python', 'Java'] },
  { title: 'Web development', icon: '↗', skills: ['React', 'Vite', 'HTML5', 'CSS3', 'Responsive UI'] },
  { title: 'Linux & networking', icon: '⌘', skills: ['Linux', 'Git', 'Bash', 'Dev tools'] },
  { title: 'Docker & DevOps', icon: '▧', skills: ['Docker', 'CI/CD', 'Nginx', 'Deployment basics'] },
  { title: 'Database', icon: '◫', skills: ['SQL', 'SQLite', 'MySQL', 'Database design'] },
  { title: 'Security fundamentals', icon: '⌑', skills: ['Authentication', 'OWASP', 'Secure coding', 'API security'] },
]

export const aboutMe = {
  introduction: 'Mình là Võ Văn Chung, sinh viên ngành Kỹ thuật phần mềm tại Trường Công nghệ Thông tin và Truyền thông Việt-Hàn. Mình yêu thích khám phá công nghệ web, tối ưu trải nghiệm người dùng và xây dựng những ứng dụng có giá trị thực tế.',
  direction: 'Mình muốn hướng phát triển theo mảng Frontend và Full-stack Web, tập trung vào React, TypeScript, API và UI/UX để tạo ra các sản phẩm sạch, hiệu quả và dễ mở rộng.',
  focusAreas: ['React', 'TypeScript', 'UI/UX', 'Frontend architecture', 'API integration'],
}

export const projects: {
  name: string
  description: string
  technologies: string[]
  image?: string
  github?: string
  demo?: string
}[] = [
  {
    name: 'Portfolio cá nhân',
    description: 'Trang cá nhân hiện đại để giới thiệu dự án, kỹ năng và các mối liên hệ trong một giao diện trực quan và tối giản.',
    technologies: ['React', 'TypeScript', 'Vite', 'CSS'],
    github: 'https://github.com/VoVanChung2508/PORTFOLIO',
    demo: '#home',
  },
  {
    name: 'Hệ thống quản lý học tập',
    description: 'Ứng dụng web giúp theo dõi tiến độ học tập, quản lý nhiệm vụ và hỗ trợ cá nhân hóa lộ trình học.',
    technologies: ['React', 'Node.js', 'SQLite'],
    github: '#',
    demo: '#',
  },
  {
    name: 'API thông báo & quản trị banner',
    description: 'Backend REST API hỗ trợ cập nhật banner và gửi thông báo đến thiết bị qua Pushbullet với kiểm soát bảo mật cơ bản.',
    technologies: ['Flask', 'Python', 'REST API'],
    github: '#',
    demo: '#',
  },
]

export const education: {
  school: string
  major: string
  period?: string
  details?: string[]
}[] = [
  {
    school: 'Đại học Công nghệ Thông tin',
    major: 'Công nghệ thông tin',
    period: '2022 — Hiện tại',
    details: ['Học tập về lập trình, hệ thống phần mềm và phát triển ứng dụng web.', 'Tích lũy kỹ năng thực tế qua dự án cá nhân và môi trường học tập kỹ thuật.'],
  },
]
