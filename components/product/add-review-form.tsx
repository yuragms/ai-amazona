"use client"

import { useState } from "react"
import { submitReview } from "@/app/actions/review"
import { StarRatingInput } from "./star-rating"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AddReviewFormProps = {
  productId: string
}

export function AddReviewForm({ productId }: AddReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  )
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setMessage("Please select a rating.")
      setStatus("error")
      return
    }
    setStatus("loading")
    setMessage("")
    const result = await submitReview(productId, rating, body.trim() || null)
    if (result.ok) {
      setStatus("success")
      setMessage("Review submitted.")
      setRating(0)
      setBody("")
    } else {
      setStatus("error")
      setMessage(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div>
        <Label className="text-sm font-medium">Your rating</Label>
        <div className="mt-2">
          <StarRatingInput value={rating} onChange={setRating} />
        </div>
      </div>
      <div>
        <Label htmlFor="review-body" className="text-sm font-medium">
          Comment (optional)
        </Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="mt-2"
          placeholder="Share your experience..."
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Submitting…" : "Submit review"}
        </Button>
        {message && (
          <span
            className={
              status === "error"
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {message}
          </span>
        )}
      </div>
    </form>
  )
}
