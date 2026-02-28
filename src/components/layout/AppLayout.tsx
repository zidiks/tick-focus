import type { ReactNode } from 'react'

interface AppLayoutProps {
  left: ReactNode
  right: ReactNode
}

export const AppLayout = ({ left, right }: AppLayoutProps) => (
  <div className="min-h-screen bg-[radial-gradient(1200px_400px_at_-5%_110%,#dbe6ff,transparent),radial-gradient(1000px_380px_at_105%_-10%,#ebefff,transparent)]">
    <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
      <main className="flex-1 p-6 md:p-10 lg:p-12">{left}</main>
      <aside className="w-full border-t border-slate-200/90 bg-white/85 p-6 backdrop-blur lg:w-[620px] lg:border-l lg:border-t-0 lg:p-8">
        {right}
      </aside>
    </div>
  </div>
)
