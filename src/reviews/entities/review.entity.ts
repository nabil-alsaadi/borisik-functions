export class ReviewsOutput {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: Review[];
}

export class Review {
  author_name: string;
  time: number;
  rating: number;
  text: string;
  profile_photo_url: string;
  relative_time_description: string;
}
