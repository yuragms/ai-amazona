import Link from "next/link"
import { StarRatingDisplay } from "./star-rating"

function formatReviewDate(date: Date) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}
import { AddReviewForm } from "./add-review-form"
import { Button } from "@/components/ui/button"

type ReviewItem = {
  id: string
  rating: number
  body: string | null
  createdAt: Date
  user: { name: string | null; image: string | null }
}

type ReviewsSectionProps = {
  productId: string
  productSlug: string
  reviews: ReviewItem[]
  session: { user?: { id: string } } | null
}

export function ReviewsSection({
  productId,
  productSlug,
  reviews,
  session,
}: ReviewsSectionProps) {
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="text-xl font-semibold text-foreground">Reviews</h2>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <StarRatingDisplay rating={averageRating} size="md" />
        <span className="text-sm text-muted-foreground">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
      </div>

      {session?.user ? (
        <div className="mt-6">
          <AddReviewForm productId={productId} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          <Button variant="link" className="h-auto p-0 text-primary" asChild>
            <Link href={`/login?callbackUrl=/products/${productSlug}`}>
              Sign in
            </Link>
          </Button>{" "}
          to leave a review.
        </p>
      )}

      <ul className="mt-8 space-y-6">
        {reviews.length === 0 ? (
          <li className="text-sm text-muted-foreground">No reviews yet.</li>
        ) : (
          reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-lg border bg-card p-4 text-card-foreground"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {review.user.name ?? "Anonymous"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatReviewDate(review.createdAt)}
                </span>
              </div>
              <div className="mt-2">
                <StarRatingDisplay rating={review.rating} size="sm" />
              </div>
              {review.body ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.body}
                </p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
