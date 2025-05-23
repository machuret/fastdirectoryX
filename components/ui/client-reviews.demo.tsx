import { ClientReviews } from "@/components/ui/client-reviews"

const demoReviews = [
  {
    rating: 5,
    reviewer: "John Doe",
    roleReviewer: "Senior Developer",
    review:
      "Excellent work! The attention to detail and clean code structure really impressed me. Would definitely recommend.",
    date: "2024-03-15",
  },
  {
    rating: 4.5,
    reviewer: "Jane Smith",
    roleReviewer: "Product Manager",
    review:
      "Great communication throughout the project. Delivered everything on time and with high quality.",
    date: "2024-03-14",
  },
  {
    rating: 4.8,
    reviewer: "Mike Johnson",
    roleReviewer: "UI/UX Designer",
    review:
      "Very professional and responsive. The implementation matched our design perfectly.",
    date: "2024-03-13",
  },
]

function ClientReviewsDemo() {
  return (
    <div className="space-y-8">
      <div>
        <ClientReviews reviews={demoReviews} />
      </div>
    </div>
  )
}

export { ClientReviewsDemo }
