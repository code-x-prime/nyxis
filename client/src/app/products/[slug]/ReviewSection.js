"use client";

import { useState } from "react";
import { BsStarFill } from "react-icons/bs";
import { FiAlertCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function ReviewSection({ product }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [form, setForm] = useState({ rating: 0, title: "", comment: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.rating) e.rating = "Please select a rating";
    if (!form.comment.trim()) e.comment = "Please write a review";
    if (form.title.trim() && form.title.trim().length < 3) e.title = "Title too short";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/auth?redirect=/products/${product.slug}&review=true`);
      return;
    }
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await fetchApi("/users/reviews", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          productId: product.id,
          rating: form.rating,
          title: form.title.trim() || "Review",
          comment: form.comment.trim(),
        }),
      });
      if (response.success) {
        toast.success("Review submitted!");
        setForm({ rating: 0, title: "", comment: "" });
        setShowForm(false);
        window.location.reload();
      } else {
        toast.error(response.message || "Failed to submit review");
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {product.reviewCount > 0 ? `${product.reviewCount} verified reviews` : "No reviews yet"}
        </p>
        <button
          onClick={() => {
            if (!isAuthenticated) {
              router.push(`/auth?redirect=/products/${product.slug}&review=true`);
              return;
            }
            setShowForm(true);
          }}
          className="px-5 py-2.5 bg-trayalife-500 hover:bg-trayalife-600 text-white text-sm font-semibold rounded-xl transition-colors font-jost"
        >
          Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-4 font-jost">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => { setForm((p) => ({ ...p, rating: star })); setErrors((p) => ({ ...p, rating: null })); }}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <BsStarFill
                  className="h-7 w-7 transition-colors"
                  style={{ color: star <= (hoverRating || form.rating) ? "#f59e0b" : "#e5e7eb" }}
                />
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-xs text-red-500 mt-1">{errors.rating}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Title <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setErrors((p) => ({ ...p, title: null })); }}
            placeholder="Summarize your experience"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-trayalife-500 focus:border-trayalife-500 transition-colors ${errors.title ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Review <span className="text-red-400">*</span></label>
          <textarea
            value={form.comment}
            onChange={(e) => { setForm((p) => ({ ...p, comment: e.target.value })); setErrors((p) => ({ ...p, comment: null })); }}
            rows={4}
            placeholder="Share your experience with this product"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-trayalife-500 focus:border-trayalife-500 transition-colors resize-none ${errors.comment ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.comment && <p className="text-xs text-red-500 mt-1">{errors.comment}</p>}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-trayalife-500 hover:bg-trayalife-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 font-jost flex items-center gap-2"
          >
            {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isSubmitting ? "Submitting…" : "Submit Review"}
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setErrors({}); setForm({ rating: 0, title: "", comment: "" }); }}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
