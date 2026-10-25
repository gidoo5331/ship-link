import { permanentRedirect } from "next/navigation"

type Props = { params: Promise<{ slug: string }> }

// Car pages moved to the shared product page; keep old links working
export default async function CarDetailPage({ params }: Props) {
  const { slug } = await params
  permanentRedirect(`/products/${slug}`)
}
