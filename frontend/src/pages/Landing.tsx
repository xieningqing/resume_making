import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/Navbar'
import { ToastContainer } from '@/components/ui/Toast'
import './Landing.css'

export function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <Navbar />
      <div className="landing">
        <section className="landing-hero">
          <div className="landing-hero-badge">Markdown 简历制作工具</div>
          <h1 className="landing-hero-title">
            用 <span className="landing-gradient-text">Markdown</span> 写出
            <br />
            专业简历
          </h1>
          <p className="landing-hero-desc">
            专注内容，告别排版烦恼。实时预览、多模板切换、一键导出 PDF 和图片。
          </p>
          <div className="landing-hero-actions">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button size="lg">{isAuthenticated ? '进入工作台' : '免费开始使用'}</Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/login">
                <Button variant="secondary" size="lg">登录</Button>
              </Link>
            )}
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">✏️</div>
              <h3>Markdown 编辑</h3>
              <p>用你熟悉的 Markdown 语法编写简历，专注内容而非排版。</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">👁️</div>
              <h3>实时预览</h3>
              <p>左侧编辑，右侧实时预览，所见即所得。</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🎨</div>
              <h3>模板切换</h3>
              <p>多种精美背景模板，一键切换，快速美化简历。</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📥</div>
              <h3>一键导出</h3>
              <p>支持导出 PNG 图片和 PDF 文档，方便各类投递场景。</p>
            </div>
          </div>
        </section>
      </div>
      <ToastContainer />
    </>
  )
}
