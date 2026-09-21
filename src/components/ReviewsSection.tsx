"use client";

import React from "react";
import { RESTAURANT_DATA } from "@/data/restaurantData";
import { Star, MessageSquareQuote, ThumbsUp, Heart } from "lucide-react";

export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-20 bg-white dark:bg-gray-950 scroll-mt-20 border-t border-gray-200/60 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/40 mb-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Google Verified Reviews</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Loved by {RESTAURANT_DATA.contact.address.locality} & {RESTAURANT_DATA.contact.address.city} Foodies
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-xl">
              Here is what our guests have to say about our food quality, hospitality, and celebration arrangements.
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <span className="text-3xl font-extrabold font-serif text-gray-900 dark:text-white">
                {RESTAURANT_DATA.stats.averageRating}
              </span>
              <div className="flex text-amber-400 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
            </div>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-3">
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {RESTAURANT_DATA.stats.totalReviews} Happy Reviews
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Google Maps & Local Patrons
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {RESTAURANT_DATA.reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400">{rev.date}</span>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed mb-4">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-gray-200/60 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {rev.name}
                </p>
                {rev.favoriteDish && (
                  <p className="text-[11px] text-chili-600 dark:text-chili-400 font-medium mt-0.5">
                    Favorite: {rev.favoriteDish}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
