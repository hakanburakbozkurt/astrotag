export type GlobalFeedbackStats = {
  total_reviews: number;
  average_rating: number;
  accuracy_percentage: number;
};

/** Client + server paylaşılan boş sosyal kanıt verisi */
export const EMPTY_GLOBAL_FEEDBACK_STATS: GlobalFeedbackStats = {
  total_reviews: 0,
  average_rating: 0,
  accuracy_percentage: 0,
};
