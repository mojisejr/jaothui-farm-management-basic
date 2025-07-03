import { redirect } from 'next/navigation'

export default async function FarmOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Redirect to dashboard as the new default farm page
  redirect(`/farm/${id}/dashboard`)
}
