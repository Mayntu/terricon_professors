import { LangSwitch } from '@/modules/ext-core/ui'
import { useT } from '@/modules/ext-core/main-i18n'
import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'
import { LoginForm } from '@/features/identity/components/LoginForm'
import { apiEnabled } from '@/services/http/client'
import '@/modules/ext-core/ext.css'
import { DemoLoginForm } from '@/features/identity/components/DemoLoginForm'
import { useDemoSession } from '@/features/identity/demo-context'
import { getDemoRole } from '@/features/identity/demo-roles'
import { ProcessMap } from './ProcessMap'
import { useLoginIntro } from './useLoginIntro'

export default function LoginPage() {
  const t = useT()
  const root = useLoginIntro()
  const { role } = useDemoSession()
  useEffect(() => { document.title = 'Ваше пространство · JanaМен' }, [])

  if (role) return <Navigate to={getDemoRole(role).home} replace />

  return (
    <div className="login-page" ref={root}>
      <a className="skip-link" href="#demo-login">{t('Перейти ко входу')}</a>
      <div className="login-editorial">
        <header className="login-header"><Wordmark /><LangSwitch /><span className="login-edition eyebrow">{t('ЛЮДИ.')}<br />{t('ПРОЦЕССЫ. БАЛАНС.')}</span></header>
        <main className="login-main" id="demo-login" tabIndex={-1}>
          <div className="login-eyebrow"><span className="editorial-rule" /><span className="eyebrow">{t('Ваш день. Ваше пространство.')}</span></div>
          <h1 className="login-title" aria-label={t('Работа — в вашем ритме.')}>
            <span className="title-mask" aria-hidden="true"><span className="js-title-line">{t('Работа —')}</span></span>
            <span className="title-mask" aria-hidden="true"><span className="js-title-line">{t('в вашем')}</span></span>
            <span className="title-mask title-last-line" aria-hidden="true"><span className="js-title-line">{t('ритме')}<span className="title-period">.</span></span></span>
          </h1>
          <p className="login-description">{t('Отпуск, обучение и поддержка HR.')}<br />{t('Все рабочие вопросы — в одном месте.')}</p>
          {apiEnabled ? <LoginForm /> : <DemoLoginForm />}
        </main>
        <footer className="login-footer"><span className="eyebrow">{t('СОЗДАНО ВОКРУГ ЧЕЛОВЕКА')}</span><span className="login-footer-mark" aria-hidden="true">J / M <span>↗</span></span></footer>
      </div>
      <ProcessMap />
    </div>
  )
}
