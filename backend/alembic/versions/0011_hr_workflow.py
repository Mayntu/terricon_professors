"""Organization scope, revocable sessions, and escalation-only timeout policy."""
from alembic import op
import sqlalchemy as sa
revision = "0011_hr_workflow"
down_revision = "0010_ext_shifts"
branch_labels = None
depends_on = None


def upgrade():
    for table in ("employees", "units"):
        op.add_column(table, sa.Column("organization_id", sa.String(64), nullable=False, server_default="jana-post"))
        op.create_index(f"ix_{table}_organization_id", table, ["organization_id"])
    op.add_column("employees", sa.Column("auth_version", sa.Integer(), nullable=False, server_default="0"))
    op.execute("UPDATE ext_policies SET on_timeout = 'escalate_hr' WHERE on_timeout = 'auto_approve'")


def downgrade():
    op.drop_column("employees", "auth_version")
    for table in ("units", "employees"):
        op.drop_index(f"ix_{table}_organization_id", table_name=table)
        op.drop_column(table, "organization_id")
