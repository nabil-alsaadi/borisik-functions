import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import Fuse from 'fuse.js';
import { paginate } from '../common/pagination/paginate';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { GetReviewsDto, ReviewPaginator } from './dto/get-reviews.dto';
import reviewJSON from '../db/reviews.json';
import { Review, ReviewsOutput } from './entities/review.entity';
import { FirebaseService } from '../firebase/firebase.service';
import axios from 'axios';

const reviews = plainToClass(Review, reviewJSON);
const options = {
  keys: ['product_id'],
  threshold: 0.3,
};
const fuse = new Fuse(reviews, options);

@Injectable()
export class ReviewService {
  private reviews: Review[] = reviews;
  
  constructor(private readonly firebaseService: FirebaseService) {}
  
  async getreviews(placeId: string): Promise<ReviewsOutput> {
    const apiKey = 'AIzaSyCuKIzXy2rfKtxL32YjVMurVXNxNS0klbo';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      console.log('response.data',response.data)
      const reviews = response.data?.result?.reviews ?? []
      console.log('reviews',reviews)
      return response?.data?.result; // Send the response back to the frontend
    } catch (error) {
      console.error('Error fetching Google Places reviews:', error);
      throw new NotFoundException(`'Failed to fetch reviews`);
    }
    
  }

  // findAllReviews({ limit, page, search, product_id }: GetReviewsDto) {
  //   if (!page) page = 1;
  //   if (!limit) limit = 30;
  //   const startIndex = (page - 1) * limit;
  //   const endIndex = page * limit;
  //   let data: Review[] = this.reviews;

  //   if (search) {
  //     const parseSearchParams = search.split(';');
  //     for (const searchParam of parseSearchParams) {
  //       const [key, value] = searchParam.split(':');
  //       data = fuse.search(value)?.map(({ item }) => item);
  //     }
  //   }

  //   if (product_id) {
  //     data = data.filter((p) => p.product_id === Number(product_id));
  //   }

  //   const results = data.slice(startIndex, endIndex);
  //   const url = `/reviews?search=${search}&limit=${limit}`;
  //   return {
  //     data: results,
  //     ...paginate(data.length, page, limit, results.length, url),
  //   };
  // }

  // findReview(id: number) {
  //   return this.reviews.find((p) => p.id === id);
  // }

  // create(createReviewDto: CreateReviewDto) {
  //   return this.reviews[0];
  // }

  // update(id: number, updateReviewDto: UpdateReviewDto) {
  //   return this.reviews[0];
  // }

  // delete(id: number) {
  //   return this.reviews[0];
  // }
}
