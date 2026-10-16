import type { ReactNode } from 'react'

export function WorkspaceHeading({ index, title, children }: { index: string; title: string; children?: ReactNode }) {
  return <header className="workspace-page-heading"><p className="eyebrow">JANA FLOW <span>{index}</span></p><h1>{title}<span className="heading-dot">.</span></h1>{children && <p>{children}</p>}</header>
}
