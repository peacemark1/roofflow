interface Props { status: string }

export function StatusBadge({ status }: Props) {
  return <span className={`badge-${status} badge capitalize`}>{status}</span>
}
