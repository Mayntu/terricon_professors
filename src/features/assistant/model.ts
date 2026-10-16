export interface KnowledgeSource {
  readonly articleId: string
  readonly title: string
  readonly section: string
  readonly updatedAt: string
}

/** A grounded answer must carry at least one permitted knowledge source. */
export type AssistantAnswer =
  | { readonly kind: 'grounded'; readonly text: string; readonly sources: readonly [KnowledgeSource, ...KnowledgeSource[]] }
  | { readonly kind: 'no-answer'; readonly message: string; readonly escalation: 'HR' }

export interface KnowledgeArticle {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly updatedAt: string
}
