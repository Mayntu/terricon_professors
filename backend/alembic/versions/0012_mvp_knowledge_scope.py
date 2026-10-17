"""Scope knowledge and anonymous question groups to the employee's organization."""
from alembic import op
import sqlalchemy as sa

revision = "0012_mvp_knowledge_scope"
down_revision = "0011_hr_workflow"
branch_labels = None
depends_on = None


def upgrade():
    for table in ("kb_docs", "kb_questions", "ext_kb_gap_groups"):
        op.add_column(table, sa.Column("organization_id", sa.String(64), nullable=False, server_default="jana-post"))
        op.create_index(f"ix_{table}_organization_id", table, ["organization_id"])
    for old in ("заявка одобряется автоматически по политике HR", "заявка одобряется автоматически"):
        op.execute(sa.text("UPDATE kb_docs SET body_md = replace(body_md, :old, :new) WHERE id IN ('kb-kz-guarantees', 'kb-kz-vacation')").bindparams(
            old=old, new="заявка передаётся HR для решения; автоматического согласования нет"
        ))


def downgrade():
    for table in ("ext_kb_gap_groups", "kb_questions", "kb_docs"):
        op.drop_index(f"ix_{table}_organization_id", table_name=table)
        op.drop_column(table, "organization_id")
