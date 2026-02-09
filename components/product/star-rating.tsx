import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingDisplayProps = {
  rating: number
  maxStars?: number
  size?: "sm" | "md"
  className?: string
}

/** Displays a fixed star rating (rounded to whole stars). */
export function StarRatingDisplay({
  rating,
  maxStars = 5,
  size = "md",
  className,
}: StarRatingDisplayProps) {
  const full = Math.min(maxStars, Math.round(rating))
  const empty = maxStars - full
  const iconClass = size === "sm" ? "size-4" : "size-5"

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rating: ${rating} out of ${maxStars}`}
    >
      {Array.from({ length: full }, (_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(iconClass, "fill-amber-400 text-amber-400")}
        />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(iconClass, "text-gray-300 dark:text-gray-600")}
        />
      ))}
    </div>
  )
}

type StarRatingInputProps = {
  value: number
  onChange: (value: number) => void
  maxStars?: number
  className?: string
}

/** Interactive star rating for forms (1–5). */
export function StarRatingInput({
  value,
  onChange,
  maxStars = 5,
  className,
}: StarRatingInputProps) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const star = i + 1
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onChange(star)
              }
            }}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={
                star <= value
                  ? "size-8 fill-amber-400 text-amber-400"
                  : "size-8 text-muted-foreground/50"
              }
            />
          </button>
        )
      })}
    </div>
  )
}
