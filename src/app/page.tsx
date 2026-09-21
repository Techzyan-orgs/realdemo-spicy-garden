"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import QuickHighlights from "@/components/QuickHighlights";
import MenuSection from "@/components/MenuSection";
import Specialties from "@/components/Specialties";
import OccasionsSection from "@/components/OccasionsSection";
import AmbianceGallery from "@/components/AmbianceGallery";
import ReviewsSection from "@/components/ReviewsSection";
import LocationContact from "@/components/LocationContact";
import ReservationModal from "@/components/ReservationModal";
import FloatingActions from "@/components/FloatingActions";
import FloatingCartBar from "@/components/FloatingCartBar";
import Footer from "@/components/Footer";
import WhatsAppOptInPrompt from "@/components/WhatsAppOptInPrompt";

export default function Home() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<string>("Birthday Celebration");

  const handleOpenBooking = (occasion?: string) => {
    if (occasion) {
      setSelectedOccasion(occasion);
    }
    setBookingModalOpen(true);
  };

  const handleCloseBooking = () => {
    setBookingModalOpen(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col w-full max-w-full overflow-x-clip">
      {/* Sticky Navigation Header */}
      <Navbar onOpenBooking={handleOpenBooking} />

      {/* Main Content Sections */}
      <main className="flex-1 w-full max-w-full overflow-x-clip">
        {/* Hero with LCP fetchpriority="high" */}
        <Hero onOpenBooking={handleOpenBooking} />

        {/* Quick Highlights / USPs */}
        <QuickHighlights />

        {/* Full Interactive Menu & Category Filters */}
        <MenuSection />

        {/* Chef's Signature Specials */}
        <Specialties onOpenBooking={handleOpenBooking} />

        {/* Party & Celebration Hub ("You Celebrate, We Take Care") */}
        <OccasionsSection onOpenBooking={handleOpenBooking} />

        {/* Restaurant Dining Room, Murals & Food Lightbox Gallery */}
        <AmbianceGallery />

        {/* Verified Customer Reviews */}
        <ReviewsSection />

        {/* Contact, Timings, Direct Call, WhatsApp & Interactive Map */}
        <LocationContact />
      </main>

      {/* Floating Animated Cart Bar */}
      <FloatingCartBar />

      {/* Mobile Sticky Floating Actions */}
      <FloatingActions onOpenBooking={handleOpenBooking} />

      {/* Footer with NAP */}
      <Footer />

      {/* Light-Dismiss Table & Party Booking Dialog */}
      <ReservationModal
        isOpen={bookingModalOpen}
        onClose={handleCloseBooking}
        defaultOccasion={selectedOccasion}
      />

      {/* Behavioral WhatsApp Opt-In Prompt */}
      <WhatsAppOptInPrompt />
    </div>
  );
}
