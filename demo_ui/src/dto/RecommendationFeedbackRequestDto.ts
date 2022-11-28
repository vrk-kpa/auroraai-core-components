export type RecommendationFeedbackRequestDto = {
  auroraai_recommendation_id: number
  service_feedbacks: [ServiceFeedback]
}

type ServiceFeedback = {
  service_id: string
  feedback_score: number
  extended_feedback?: string[]
}
