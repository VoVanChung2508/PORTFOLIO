export const profile = {
  name: import.meta.env.VITE_PORTFOLIO_NAME || '[YOUR_NAME]',
  role: import.meta.env.VITE_PORTFOLIO_ROLE || '[YOUR_ROLE]',
  major: import.meta.env.VITE_PORTFOLIO_MAJOR || '[YOUR_MAJOR]',
  email: import.meta.env.VITE_PORTFOLIO_EMAIL || '',
  github: import.meta.env.VITE_PORTFOLIO_GITHUB || '',
  linkedin: import.meta.env.VITE_PORTFOLIO_LINKEDIN || '',
  instagram: import.meta.env.VITE_PORTFOLIO_INSTAGRAM || '',
  facebook: import.meta.env.VITE_PORTFOLIO_FACEBOOK || '',
  location: import.meta.env.VITE_PORTFOLIO_LOCATION || '',
  availability: import.meta.env.VITE_PORTFOLIO_AVAILABILITY || '',
}

export const skillGroups = [
  { title: 'Programming', icon: '</>', skills: [] as string[] },
  { title: 'Web development', icon: '↗', skills: [] as string[] },
  { title: 'Linux & networking', icon: '⌘', skills: [] as string[] },
  { title: 'Docker & DevOps', icon: '▧', skills: [] as string[] },
  { title: 'Database', icon: '◫', skills: [] as string[] },
  { title: 'Security fundamentals', icon: '⌑', skills: [] as string[] },
]

export const aboutMe = {
  introduction: '[YOUR_ABOUT]',
  direction: '[YOUR_CAREER_DIRECTION]',
  focusAreas: ['[CURRENT_FOCUS_1]', '[CURRENT_FOCUS_2]', '[CURRENT_FOCUS_3]'],
}

export const projects: {
  name: string
  description: string
  technologies: string[]
  image?: string
  github?: string
  demo?: string
}[] = []

export const education: {
  school: string
  major: string
  period?: string
  details?: string[]
}[] = []
