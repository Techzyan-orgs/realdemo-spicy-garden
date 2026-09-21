export interface MenuItem {
  id: string;
  name: string;
  category: 'pizza' | 'pasta' | 'burger' | 'maggi' | 'sandwich' | 'chinese_specials';
  price: number;
  chickenPrice?: number; // for items with veg/chicken options (e.g. Pasta)
  isVeg: boolean;
  isSpicy?: boolean;
  isBestSeller?: boolean;
  isSpecial?: boolean;
  description: string;
  image?: string;
  image_url?: string;
  tags?: string[];
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  favoriteDish?: string;
}

export interface USPItem {
  id: string;
  title: string;
  description: string;
  iconName: 'Sparkles' | 'Tv' | 'Utensils' | 'Users' | 'HeartHandshake' | 'Clock' | 'ShieldCheck';
  highlight: string;
}

export interface OccasionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  icon: 'Cake' | 'Heart' | 'PartyPopper' | 'Briefcase' | 'Smile';
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: 'food' | 'ambiance' | 'celebration';
  title: string;
  description: string;
}

export interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  subtitle?: string;
  description?: string;
  image?: string;
}

export const RESTAURANT_DATA = {
  heroSpotlight: {
    tag: "Oven-Fresh Favorite",
    title: "Gourmet Handcrafted Pizzas",
    priceLabel: "Starting at",
    price: "₹149"
  },

  brand: {
    name: "The Spicy Garden - Cafe & Bistro",
    shortName: "The Spicy Garden",
    altName: "Spicy Garden Cafe & Resto",
    tagline: "You Celebrate, We Take Care!",
    secondaryTagline: "Good Food. Good Mood.",
    motto: "Delicious Food • Warm Ambience • Memorable Moments",
    foundedYear: "2023",
    description: "Welcome to The Spicy Garden Cafe & Bistro — Baguiati's favorite hangout for mouth-watering gourmet pizzas, handcrafted pastas, juicy burgers, comforting Maggi, street-style Chinese combos, and Tibetan momos. Adorned with beautiful Asian art murals, comfortable air-conditioned seating, live sports screening, and pocket-friendly pricing, we make every dining experience and celebration unforgettable.",
    mission: "To serve freshly prepared, flavorful comfort food in a vibrant, welcoming cafe environment where friends, families, and colleagues can gather, celebrate, and unwind without breaking the bank."
  },

  contact: {
    phone: "8777866602",
    displayPhone: "+91 87778 66602",
    telLink: "tel:+918777866602",
    whatsappNumber: "918777866602",
    whatsappLink: "https://wa.me/918777866602?text=Hi%20The%20Spicy%20Garden!%20I%20would%20like%20to%20place%20an%20order%20or%20inquire%20about%20a%20table%20reservation.",
    whatsappPartyLink: "https://wa.me/918777866602?text=Hello%20The%20Spicy%20Garden!%20I%20would%20like%20to%20book%20a%20party%20celebration%20(Birthday%2FAnniversary%2FKitty%2FOffice).",
    email: "thespicygarden.kolkata@gmail.com",
    address: {
      street: "1/G-1, Ashwini Nagar",
      locality: "Baguiati",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700159",
      country: "India",
      landmark: "Near VIP Road, Ashwini Nagar Auto Stand / Baguiati",
      fullAddress: "1/G-1, Ashwini Nagar, Baguiati, Kolkata, West Bengal 700159, India"
    },
    geo: {
      latitude: 22.6186,
      longitude: 88.4287,
      googleMapsUrl: "https://maps.google.com/?q=1/G-1,+Ashwini+Nagar,+Baguiati,+Kolkata,+West+Bengal+700159",
      directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=1%2FG-1%2C+Ashwini+Nagar%2C+Baguiati%2C+Kolkata%2C+West+Bengal+700159",
      embedMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.2185011707254!2d88.426123!3d22.618641!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0275a539b7eb57%3A0x6b8f36c4b26715f!2sAshwini%20Nagar%2C%20Baguiati%2C%20Kolkata%2C%20West%20Bengal%20700159!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin"
    },
    socials: {
      instagram: {
        handle: "@thespicygarden76_baguiati",
        url: "https://www.instagram.com/thespicygarden76_baguiati/",
        displayText: "thespicygarden76_baguiati"
      }
    }
  },

  timings: {
    daysDisplay: "Open All 7 Days",
    hoursDisplay: "Mon–Thu, Sat–Sun: 2:00 PM – 11:30 PM | Fri: 1:00 PM – 11:00 PM",
    shortHoursDisplay: "Mon–Thu, Sat–Sun: 2–11:30 PM • Fri: 1–11 PM",
    kitchenClosesDisplay: "Last Kitchen Order: 30 minutes before closing",
    regularOpenHour24: 14.0, // 2:00 PM
    regularCloseHour24: 23.5, // 11:30 PM
    fridayOpenHour24: 13.0, // 1:00 PM
    fridayCloseHour24: 23.0, // 11:00 PM
    schedule: [
      { day: "Monday", open: "2:00 PM", close: "11:30 PM", isOpen: true },
      { day: "Tuesday", open: "2:00 PM", close: "11:30 PM", isOpen: true },
      { day: "Wednesday", open: "2:00 PM", close: "11:30 PM", isOpen: true },
      { day: "Thursday", open: "2:00 PM", close: "11:30 PM", isOpen: true },
      { day: "Friday", open: "1:00 PM", close: "11:00 PM", isOpen: true },
      { day: "Saturday", open: "2:00 PM", close: "11:30 PM", isOpen: true },
      { day: "Sunday", open: "2:00 PM", close: "11:30 PM", isOpen: true },
    ]
  },

  assets: {
    logo: "/unnamed (1).webp",
    heroPizza: "/unnamed (2).webp",
    burger: "/unnamed (3).webp",
    chineseSpread: "/unnamed (4).webp",
    chickenTenders: "/unnamed (5).webp",
    steamedMomos: "/unnamed (6).webp",
    diningHallMural: "/unnamed (7).webp",
    ramenMuralDining: "/unnamed (8).webp",
    geishaWallArt: "/unnamed (9).webp",
    cafeAmbianceTv: "/unnamed (10).webp",
    storefrontBanner: "/unnamed (11).webp",
    menuCardFull: "/menu.png",
    menuCardWebp: "/menu.webp",
    sandwich: "/sandwich.webp",
    pasta: "/pasta.webp",
    maggi: "/maggi.webp"
  },

  assetPlaceholders: {
    default: "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADwAQCdASoKAAgABABoJbACdAEQz4HbYwAA9lb7wGcMl//WYDvRJsht5vq2iiUhuxYj7QffcbBdCSlMTu35XFxmd+CtvhjtFpqpH+AA",
    heroPizza: "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADwAQCdASoKAAgABABoJbACdAEQz4HbYwAA9lb7wGcMl//WYDvRJsht5vq2iiUhuxYj7QffcbBdCSlMTu35XFxmd+CtvhjtFpqpH+AA",
    logo: "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADQAQCdASoKAAgABABoJbACdAEyqD/vYAAA/v3861uD+lGj0f477TjM5y6o4tJvXwP21D2bK9T4K86K63K2X8gA",
    momos: "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADQAQCdASoKAAgABABoJbACdAEyqD/vYAAA/v3861uD+lGj0f477TjM5y6o4tJvXwP21D2bK9T4K86K63K2X8gA",
    burger: "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADQAQCdASoKAAgABABoJbACdAEyqD/vYAAA/v3861uD+lGj0f477TjM5y6o4tJvXwP21D2bK9T4K86K63K2X8gA"
  },

  stats: {
    averageRating: "4.7",
    totalReviews: "250+",
    pricePerPerson: "₹150 – ₹300",
    seatingCapacity: "35+ Guests",
    dishesServed: "60+ Fresh Varieties"
  },

  usps: [
    {
      id: "usp-1",
      title: "Handcrafted & Cooked Fresh",
      description: "Every pizza, burger, pasta, and momo is made fresh upon order with pure ingredients, real cheese, and signature spice blends.",
      iconName: "Utensils",
      highlight: "100% Freshly Prepared"
    },
    {
      id: "usp-2",
      title: "Pocket-Friendly Goodness",
      description: "Premium cafe-style flavors and generous portions at budget-friendly student and family prices starting from just ₹69.",
      iconName: "Sparkles",
      highlight: "From Just ₹69"
    },
    {
      id: "usp-3",
      title: "Cozy AC Ambiance & Murals",
      description: "Chic modern decor featuring hand-painted oriental wall murals, soft ambient lighting, and fully air-conditioned comfortable seating.",
      iconName: "HeartHandshake",
      highlight: "Instagrammable Decor"
    },
    {
      id: "usp-4",
      title: "Live Sports on Big Screen",
      description: "Cheer for your favorite cricket and football matches with fellow foodies on our high-definition television display.",
      iconName: "Tv",
      highlight: "Cricket & Match Nights"
    },
    {
      id: "usp-5",
      title: "All-Occasion Party Specialists",
      description: "Celebrate birthdays, anniversaries, kitty parties, or corporate team outings with customized party food platters and dedicated assistance.",
      iconName: "Users",
      highlight: "You Celebrate, We Take Care"
    }
  ] as USPItem[],

  occasions: [
    {
      id: "birthday",
      title: "Birthday Bashes",
      subtitle: "Unforgettable Parties with Loved Ones",
      description: "From intimate birthday gatherings to buzzing gang parties, we set up the tables, prepare festive platters, and keep the food flowing.",
      benefits: ["Customized food combos & platters", "Flexible seating arrangements", "Music & celebratory vibe"],
      icon: "Cake"
    },
    {
      id: "anniversary",
      title: "Anniversaries & Date Nights",
      subtitle: "Romantic & Cozy Bistro Setting",
      description: "Enjoy intimate candlelit vibes under our warm ambient lighting, sharing artisanal pastas, crispy thin pizzas, and mocktail coolers.",
      benefits: ["Warm pendant ambient lighting", "Peaceful & air-conditioned setting", "Special couple meal combos"],
      icon: "Heart"
    },
    {
      id: "kitty",
      title: "Kitty Parties & Socials",
      subtitle: "Afternoon Giggles & Delectable Bites",
      description: "Gather your friends for an afternoon of endless gossip, steaming coffee, cheesy club sandwiches, and spicy garlic Maggi bowls.",
      benefits: ["Dedicated seating zone", "Easy sharing snacks & beverages", "Comfortable relaxed ambiance"],
      icon: "PartyPopper"
    },
    {
      id: "office",
      title: "Office Parties & Team Hangouts",
      subtitle: "Unwind After Work with Teammates",
      description: "Reward your team after a successful project sprint or celebrate office milestones with group meals and live match screenings.",
      benefits: ["Quick service for team lunches", "Beverage & starter packages", "Big screen entertainment"],
      icon: "Briefcase"
    }
  ] as OccasionItem[],

  gallery: [
    {
      id: "gal-1",
      src: "/unnamed (2).webp",
      alt: "Loaded Cheese Gourmet Pizza with Olives, Bell Peppers and Fresh Herbs",
      category: "food",
      title: "Signature Gourmet Pizza",
      description: "Handcrafted thin crust pizza smothered with premium cheese, black olives, crisp bell peppers, and signature herbs."
    },
    {
      id: "gal-2",
      src: "/unnamed (7).webp",
      alt: "Spicy Garden Cafe Dining Hall featuring Orange Seating and Beijing Opera Mural",
      category: "ambiance",
      title: "Vibrant Main Dining Hall",
      description: "Fully air-conditioned dining lounge with stylish orange chairs, brick accenting, and hand-painted Asian wall mural."
    },
    {
      id: "gal-3",
      src: "/unnamed (6).webp",
      alt: "Tibetan Steamed Momos served with Clear Soup Broth and Spicy Chutney Dip",
      category: "food",
      title: "Authentic Steamed Momos",
      description: "Delicately pleated momos served steaming hot alongside seasoned clear chicken or vegetable broth and fiery red chilli chutney."
    },
    {
      id: "gal-4",
      src: "/unnamed (8).webp",
      alt: "Artistic Ramen Noodle and Flying Chopsticks Wall Mural in the Cafe Dining Room",
      category: "ambiance",
      title: "Ramen Art Wall & Booths",
      description: "Playful culinary art mural depicting flying ramen noodles and Japanese chopsticks, a favorite guest photo spot."
    },
    {
      id: "gal-5",
      src: "/unnamed (4).webp",
      alt: "Indo-Chinese Fried Rice and Tangy Chilli Chicken Sizzling Platter",
      category: "food",
      title: "Chinese Combo Feast",
      description: "Wok-tossed aromatic fried rice bowls paired with sizzling spicy chilli chicken gravy and bell peppers."
    },
    {
      id: "gal-6",
      src: "/unnamed (10).webp",
      alt: "Spicy Garden Cafe Interior with Live Match TV and Reading Quote Wall",
      category: "ambiance",
      title: "Lounge with Live Match TV",
      description: "Spacious layout with wall quotes, cozy book display, and wall-mounted screen for live match screening."
    },
    {
      id: "gal-7",
      src: "/unnamed (5).webp",
      alt: "Golden Crispy Fried Chicken Tenders with Schezwan Dipping Sauce",
      category: "food",
      title: "Crispy Golden Tenders",
      description: "Crunchy crumb-coated chicken strips fried to golden perfection, served with spicy home-style dip."
    },
    {
      id: "gal-8",
      src: "/unnamed (3).webp",
      alt: "Grilled Cheese Burger with Fresh Lettuce and Layered Patties",
      category: "food",
      title: "Stacked Grilled Burger",
      description: "Toasted sesame bun with a crispy cutlet patty, melted cheese slice, crisp iceberg lettuce, and special bistro sauce."
    },
    {
      id: "gal-9",
      src: "/unnamed (9).webp",
      alt: "Warm Ambient Light illuminating the Geisha Wall Mural at Night",
      category: "ambiance",
      title: "Evening Bistro Vibes",
      description: "Cozy warm spot lighting highlighting the traditional Geisha mural, creating an intimate evening atmosphere."
    },
    {
      id: "gal-10",
      src: "/unnamed (11).webp",
      alt: "The Spicy Garden Cafe & Bistro Celebration Booking Storefront Board",
      category: "celebration",
      title: "Party & Occasion Hub",
      description: "Storefront celebration showcase inviting guests to book birthdays, anniversaries, kitty, and office parties."
    }
  ] as GalleryImage[],

  menu: {
    categories: [
      {
        id: "all",
        label: "All Items",
        icon: "Utensils",
        subtitle: "Complete menu catalog across all 6 categories",
        description: "Browse all freshly prepared dishes or open multiple categories simultaneously."
      },
      {
        id: "pizza",
        label: "Pizzas",
        icon: "Pizza",
        subtitle: "11 Handcrafted Pizzas • Starting at ₹149",
        description: "Hand-stretched golden crusts smothered in rich Italian marinara, loaded mozzarella, and fresh gourmet toppings.",
        image: "/unnamed (2).webp"
      },
      {
        id: "pasta",
        label: "Pastas",
        icon: "Bowl",
        subtitle: "4 Italian Penne Classics • Starting at ₹129",
        description: "Al dente penne bathed in velvety Alfredo white sauce, zesty Arrabbiata red sauce, or chef's secret baked pink sauce.",
        image: "/pasta.webp"
      },
      {
        id: "burger",
        label: "Burgers",
        icon: "Sandwich",
        subtitle: "9 Stacked Gourmet Burgers • Starting at ₹79",
        description: "Crispy fried and grilled cutlets with melted cheese slices, fresh garden relish, and bistro sauce in toasted sesame buns.",
        image: "/unnamed (3).webp"
      },
      {
        id: "maggi",
        label: "Maggi Specials",
        icon: "Soup",
        subtitle: "8 Street-Style Noodle Bowls • Starting at ₹69",
        description: "Comforting 2-minute Kolkata cafe-style noodles elevated with fiery garlic chilli, golden sweet corn, and double cheese.",
        image: "/maggi.webp"
      },
      {
        id: "sandwich",
        label: "Sandwiches & Clubs",
        icon: "Layers",
        subtitle: "19 Toasted & Club Grills • Starting at ₹79",
        description: "Triple-decker toasted club sandwiches, golden corn cheese grills, spiced paneer tikka melts, and loaded cheese toasts.",
        image: "/sandwich.webp"
      },
      {
        id: "chinese_specials",
        label: "Chinese & Starters",
        icon: "Flame",
        subtitle: "3 Street-Style Specialties • Starting at ₹129",
        description: "Authentic Tibetan steamed momos served with fiery red dip & clear soup, crispy chicken strips, and wok-tossed fried rice.",
        image: "/unnamed (6).webp"
      }
    ] as MenuCategory[],

    items: [
      // PIZZA (Verified from menu.png)
      {
        id: "piz-1",
        name: "Veg Cheese Pizza",
        category: "pizza",
        price: 149,
        isVeg: true,
        description: "Classic golden crust loaded with savory tomato concassé and melted mozzarella cheese.",
        tags: ["Classic", "Bestseller"]
      },
      {
        id: "piz-2",
        name: "Cheese Corn Pizza",
        category: "pizza",
        price: 169,
        isVeg: true,
        description: "Sweet American golden corn kernels layered generously with double mozzarella.",
        tags: ["Kids Favorite"]
      },
      {
        id: "piz-3",
        name: "Mushroom Cheese Pizza",
        category: "pizza",
        price: 169,
        isVeg: true,
        description: "Sautéed fresh button mushrooms infused with Italian herbs and gooey molten cheese.",
        tags: ["Herbaceous"]
      },
      {
        id: "piz-4",
        name: "Paneer Pizza",
        category: "pizza",
        price: 179,
        isVeg: true,
        description: "Tender cubes of fresh cottage cheese, diced onions, green peppers, and rich tomato reduction.",
        tags: ["Vegetarian Delight"]
      },
      {
        id: "piz-5",
        name: "Cheese Burst Pizza",
        category: "pizza",
        price: 199,
        isVeg: true,
        isBestSeller: true,
        description: "Crust oozing with liquid molten cheese and topped with a lavish layer of browned mozzarella.",
        tags: ["Cheese Lovers", "Super Cheesy"]
      },
      {
        id: "piz-6",
        name: "Paneer Tikka Pizza",
        category: "pizza",
        price: 199,
        isVeg: true,
        isSpicy: true,
        description: "Marinated smoky tandoori paneer cubes, capsicum, red onions, and Indian spiced marinara.",
        tags: ["Desi Fusion", "Spicy"]
      },
      {
        id: "piz-7",
        name: "Chicken Pizza",
        category: "pizza",
        price: 199,
        isVeg: false,
        description: "Juicy herb-seasoned chicken chunks, melted cheese, and aromatic oregano toppings.",
        tags: ["Chef Special"]
      },
      {
        id: "piz-8",
        name: "Chicken Tikka Pizza",
        category: "pizza",
        price: 219,
        isVeg: false,
        isSpicy: true,
        isBestSeller: true,
        description: "Smoky clay-oven spiced chicken tikka strips with crunchy onions, green capsicum, and chilli flakes.",
        tags: ["Must Try", "Spicy"]
      },
      {
        id: "piz-9",
        name: "Chicken Cheese Burst Pizza",
        category: "pizza",
        price: 259,
        isVeg: false,
        isSpecial: true,
        description: "The ultimate indulgence — molten cheese volcano crust loaded with tender spiced chicken.",
        tags: ["Decadent", "House Favorite"]
      },
      {
        id: "piz-10",
        name: "TSG's Special [Veg] Pizza",
        category: "pizza",
        price: 269,
        isVeg: true,
        isSpecial: true,
        description: "The Spicy Garden signature vegetarian master creation: overloaded with paneer, mushrooms, sweet corn, black olives, bell peppers, and triple cheese blend.",
        tags: ["Signature Special", "Fully Loaded"]
      },
      {
        id: "piz-11",
        name: "TSG's Special [Chicken] Pizza",
        category: "pizza",
        price: 289,
        isVeg: false,
        isSpecial: true,
        isBestSeller: true,
        description: "The crown jewel of The Spicy Garden: loaded with grilled chicken, chicken tikka, black olives, onions, paprika, and supreme cheese blend.",
        tags: ["Signature Special", "Star Dish"]
      },

      // PASTA (Verified from menu.png)
      {
        id: "pas-1",
        name: "White Sauce Pasta (Alfredo Style)",
        category: "pasta",
        price: 129,
        chickenPrice: 149,
        isVeg: true,
        isBestSeller: true,
        description: "Al dente penne bathed in a luscious, velvety cream sauce with butter, garlic, herbs, and parmesan.",
        tags: ["Creamy Alfredo"]
      },
      {
        id: "pas-2",
        name: "Red Sauce Pasta (Arrabbiata Style)",
        category: "pasta",
        price: 129,
        chickenPrice: 149,
        isVeg: true,
        isSpicy: true,
        description: "Zesty Italian plum tomato sauce simmered with crushed garlic, extra virgin olive oil, and fiery red chilli flakes.",
        tags: ["Tangy & Spicy"]
      },
      {
        id: "pas-3",
        name: "Mix Sauce Pasta (Pink Sauce Rosa)",
        category: "pasta",
        price: 129,
        chickenPrice: 149,
        isVeg: true,
        isBestSeller: true,
        description: "The perfect symphony of rich white cream and robust tangy arrabbiata sauce, tossed with crisp seasonal vegetables.",
        tags: ["Best of Both"]
      },
      {
        id: "pas-4",
        name: "TSG's Special Baked Pasta",
        category: "pasta",
        price: 179,
        chickenPrice: 199,
        isVeg: true,
        isSpecial: true,
        description: "Oven-baked penne layered with chef's secret spiced sauce, extra toppings, and a thick golden gratin cheese crust.",
        tags: ["Oven Baked", "Signature"]
      },

      // BURGER (Verified from menu.png)
      {
        id: "bur-1",
        name: "Veg Burger",
        category: "burger",
        price: 79,
        isVeg: true,
        description: "Crisp seasoned vegetable patty tucked into a soft toasted bun with tomato, onion, and herb mayo.",
        tags: ["Value Pick"]
      },
      {
        id: "bur-2",
        name: "Veg Cheese Burger",
        category: "burger",
        price: 99,
        isVeg: true,
        description: "Crispy veg patty crowned with melted processed cheese slice and sweet and tangy relish.",
        tags: ["Bestseller"]
      },
      {
        id: "bur-3",
        name: "Veg Double Cheese Burger",
        category: "burger",
        price: 109,
        isVeg: true,
        description: "Double layers of decadent cheese enveloping a seasoned golden crunchy patty with fresh iceberg lettuce.",
        tags: ["Extra Cheesy"]
      },
      {
        id: "bur-4",
        name: "Chicken Burger",
        category: "burger",
        price: 119,
        isVeg: false,
        description: "Juicy, spiced minced chicken patty grilled to perfection with onions, tomatoes, and house mustard dressing.",
        tags: ["Classic Meat"]
      },
      {
        id: "bur-5",
        name: "Paneer Cheese Burger",
        category: "burger",
        price: 119,
        isVeg: true,
        description: "Thick spiced paneer steak layered with garlic herb butter, melted cheese, and crunchy veggies.",
        tags: ["Vegetarian Power"]
      },
      {
        id: "bur-6",
        name: "Chicken Cheese Burger",
        category: "burger",
        price: 129,
        isVeg: false,
        isBestSeller: true,
        description: "Crispy succulent chicken patty hugged by a warm melted cheddar cheese blanket and house special dressing.",
        tags: ["Top Favorite"]
      },
      {
        id: "bur-7",
        name: "Veg King Kong Cheese Burger",
        category: "burger",
        price: 129,
        isVeg: true,
        isSpecial: true,
        description: "Jumbo double vegetable patties stacked with extra cheese, pickles, lettuce, and secret smoky sauce.",
        tags: ["Monster Size"]
      },
      {
        id: "bur-8",
        name: "TSG's Special [Veg] Burger",
        category: "burger",
        price: 139,
        isVeg: true,
        isSpecial: true,
        description: "Chef's gourmet tower with paneer and spiced potato cutlet, jalapenos, cheese blast, and spicy garden dressing.",
        tags: ["Signature Special"]
      },
      {
        id: "bur-9",
        name: "TSG's Special [Chicken] Burger",
        category: "burger",
        price: 149,
        isVeg: false,
        isSpecial: true,
        isBestSeller: true,
        description: "The ultimate meat lover's burger: crispy chicken fillet + seasoned patty, double cheese, caramelized onions, and signature sauce.",
        tags: ["Signature Special", "Crowd Pleaser"]
      },

      // MAGGI (Verified from menu.png)
      {
        id: "mag-1",
        name: "Veg Maggi",
        category: "maggi",
        price: 69,
        isVeg: true,
        description: "Classic comforting noodles tossed with fresh green peas, carrots, onions, and signature tastemaker spices.",
        tags: ["Soul Food", "Pocket Friendly"]
      },
      {
        id: "mag-2",
        name: "Veg Cheese Maggi",
        category: "maggi",
        price: 89,
        isVeg: true,
        isBestSeller: true,
        description: "Steaming hot Maggi noodles infused with a silky blanket of melted cheese.",
        tags: ["Cheesy Comfort"]
      },
      {
        id: "mag-3",
        name: "Cheese Corn Maggi",
        category: "maggi",
        price: 89,
        isVeg: true,
        description: "Sweet American corn paired with creamy molten cheese over perfectly simmered noodles.",
        tags: ["Sweet & Savory"]
      },
      {
        id: "mag-4",
        name: "Veg Chilli Garlic Maggi",
        category: "maggi",
        price: 89,
        isVeg: true,
        isSpicy: true,
        description: "Spiced up with sautéed burnt garlic, fiery green chillies, and crushed black pepper.",
        tags: ["Spicy Kick"]
      },
      {
        id: "mag-5",
        name: "Chicken Maggi",
        category: "maggi",
        price: 99,
        isVeg: false,
        description: "Tender shredded chicken morsels simmered right into aromatic spiced Maggi noodles.",
        tags: ["Protein Packed"]
      },
      {
        id: "mag-6",
        name: "Chicken Chilli Garlic Maggi",
        category: "maggi",
        price: 109,
        isVeg: false,
        isSpicy: true,
        description: "Juicy shredded chicken tossed in wok-roasted garlic and crushed red peppers for a fiery bite.",
        tags: ["Hot & Spicy"]
      },
      {
        id: "mag-7",
        name: "Chicken Cheese Maggi",
        category: "maggi",
        price: 119,
        isVeg: false,
        isBestSeller: true,
        description: "Rich shredded chicken noodles draped in hot bubbling cheese — the college favorite.",
        tags: ["Super Hit"]
      },
      {
        id: "mag-8",
        name: "TSG's Special Baked Maggi",
        category: "maggi",
        price: 129,
        isVeg: true,
        isSpecial: true,
        description: "Our viral innovation: loaded Maggi baked casserole-style with molten cheese crust and crunchy toppings.",
        tags: ["Oven Baked", "Signature Special"]
      },

      // SANDWICH (Verified from menu.png)
      {
        id: "san-1",
        name: "Veg Sandwich",
        category: "sandwich",
        price: 69,
        isVeg: true,
        description: "Crisp toasted bread with cucumber, tomato, onion rings, and mint-coriander chutney.",
        tags: ["Light Bite"]
      },
      {
        id: "san-2",
        name: "Veg Cheese Sandwich",
        category: "sandwich",
        price: 79,
        isVeg: true,
        description: "Fresh vegetable stuffing enriched with generous grated cheese, grilled golden-brown.",
        tags: ["Tea Time Favorite"]
      },
      {
        id: "san-3",
        name: "Cheese Corn Sandwich",
        category: "sandwich",
        price: 89,
        isVeg: true,
        description: "Juicy sweet corn and creamy melted cheese grilled inside herb-buttered sandwich slices.",
        tags: ["Comforting"]
      },
      {
        id: "san-4",
        name: "Egg Cheese Sandwich",
        category: "sandwich",
        price: 89,
        isVeg: false,
        description: "Fluffy seasoned egg omelette or boiled spiced egg with melting cheese and pepper.",
        tags: ["Breakfast Classic"]
      },
      {
        id: "san-5",
        name: "Chocolate Cheese Sandwich",
        category: "sandwich",
        price: 89,
        isVeg: true,
        isSpecial: true,
        description: "Warm gooey dark chocolate spread paired with mild melted cheese for an addictive sweet-salty treat.",
        tags: ["Dessert Treat"]
      },
      {
        id: "san-6",
        name: "Chicken Sandwich",
        category: "sandwich",
        price: 99,
        isVeg: false,
        description: "Juicy seasoned chicken breast slices with mayo and crunchy crisp lettuce.",
        tags: ["Hearty"]
      },
      {
        id: "san-7",
        name: "Bombay Masala Cheese Sandwich",
        category: "sandwich",
        price: 99,
        isVeg: true,
        isSpicy: true,
        description: "Zesty spiced potato masala, beetroot, capsicum, tangy chaat masala, and melted cheese.",
        tags: ["Bombay Street Style"]
      },
      {
        id: "san-8",
        name: "Paneer Cheese Sandwich",
        category: "sandwich",
        price: 109,
        isVeg: true,
        description: "Soft marinated paneer cubes tossed with capsicum and melted cheddar cheese.",
        tags: ["Rich & Filling"]
      },
      {
        id: "san-9",
        name: "Chicken Cheese Sandwich",
        category: "sandwich",
        price: 109,
        isVeg: false,
        isBestSeller: true,
        description: "Shredded roast chicken mixed with creamy herb mayonnaise and double melted cheese.",
        tags: ["Top Pick"]
      },
      {
        id: "san-10",
        name: "Egg Chicken Sandwich",
        category: "sandwich",
        price: 109,
        isVeg: false,
        description: "Double protein power: tender chicken chunks paired with seasoned egg and black pepper.",
        tags: ["High Protein"]
      },
      {
        id: "san-11",
        name: "Egg Chicken Cheese Sandwich",
        category: "sandwich",
        price: 119,
        isVeg: false,
        description: "Chicken, egg, and molten cheese toasted with butter to crisp perfection.",
        tags: ["Full Feast"]
      },
      {
        id: "san-12",
        name: "Tandoori Paneer Sandwich",
        category: "sandwich",
        price: 119,
        isVeg: true,
        isSpicy: true,
        description: "Smoky tandoori marinated paneer with diced bell peppers and spicy mint mayo.",
        tags: ["Tandoori Twist"]
      },
      {
        id: "san-13",
        name: "Paneer Tikka Cheese Sandwich",
        category: "sandwich",
        price: 129,
        isVeg: true,
        isSpicy: true,
        description: "Char-grilled paneer tikka slices layered with molten cheese and grilled crisp.",
        tags: ["Desi Gourmet"]
      },
      {
        id: "san-14",
        name: "Bombay Club Sandwich",
        category: "sandwich",
        price: 159,
        isVeg: true,
        isBestSeller: true,
        description: "Triple-decker toasted sandwich packed with masala aloo, cheese, veggies, and tangy Bombay green chutney.",
        tags: ["Triple Decker", "Bestseller"]
      },
      {
        id: "san-15",
        name: "American Club Sandwich",
        category: "sandwich",
        price: 159,
        isVeg: true,
        description: "Classic American style 3-layer toasted sandwich with coleslaw, cheese, tomato, and chips.",
        tags: ["Continental"]
      },
      {
        id: "san-16",
        name: "Paneer Club Sandwich",
        category: "sandwich",
        price: 169,
        isVeg: true,
        description: "Three layers of toasted artisan bread stuffed with spiced paneer, grilled veggies, and cheese.",
        tags: ["Jumbo Veg"]
      },
      {
        id: "san-17",
        name: "Egg Chicken Club Sandwich",
        category: "sandwich",
        price: 189,
        isVeg: false,
        isBestSeller: true,
        description: "Three massive layers loaded with roasted chicken, spiced egg, double cheese, and crisp veggies.",
        tags: ["Triple Decker King"]
      },
      {
        id: "san-18",
        name: "TSG's Special [Veg] Club Sandwich",
        category: "sandwich",
        price: 189,
        isVeg: true,
        isSpecial: true,
        description: "The Spicy Garden signature triple-decker: paneer, cheese corn, roasted peppers, and chef's secret dips.",
        tags: ["Signature Special"]
      },
      {
        id: "san-19",
        name: "TSG's Special [Chicken] Club Sandwich",
        category: "sandwich",
        price: 199,
        isVeg: false,
        isSpecial: true,
        isBestSeller: true,
        description: "The ultimate club feast: barbecue shredded chicken, fried egg, double cheese, crisp greens, and spicy house sauce.",
        tags: ["Signature Special", "Star Sandwich"]
      },

      // ASIAN, MOMOS & STARTERS (Verified from photos unnamed 4, 5, 6)
      {
        id: "chn-1",
        name: "Steamed Chicken / Veg Momos with Soup",
        category: "chinese_specials",
        price: 99,
        isVeg: false,
        isBestSeller: true,
        description: "5 pieces of handcrafted Tibetan steamed dumplings served with piping hot clear herbal broth and fiery red chilli-garlic chutney.",
        tags: ["Bestseller", "Steaming Hot"]
      },
      {
        id: "chn-2",
        name: "Golden Crispy Fried Chicken Tenders",
        category: "chinese_specials",
        price: 149,
        isVeg: false,
        isBestSeller: true,
        description: "Marinated tender chicken strips coated in seasoned panko breadcrumbs, deep-fried golden, and paired with spicy dipping salsa.",
        tags: ["Crispy Crunch", "Finger Food"]
      },
      {
        id: "chn-3",
        name: "Indo-Chinese Fried Rice & Chilli Chicken Combo",
        category: "chinese_specials",
        price: 199,
        isVeg: false,
        isSpicy: true,
        isSpecial: true,
        description: "Wok-tossed aromatic egg-chicken or veg fried rice served alongside rich, glossy Kolkata-style chilli chicken gravy with capsicum and spring onions.",
        tags: ["Combo Meal", "Crowd Favorite"]
      }
    ] as MenuItem[]
  },

  reviews: [
    {
      id: "rev-1",
      name: "Suman Sengupta",
      rating: 5,
      date: "2 weeks ago",
      comment: "A hidden gem in Ashwini Nagar, Baguiati! The ambience is so cozy with that stunning Chinese opera wall mural. We had the TSG Special Pizza and White Sauce Pasta — both were incredibly delicious and so pocket-friendly!",
      favoriteDish: "TSG Special Chicken Pizza"
    },
    {
      id: "rev-2",
      name: "Priyanka Roy",
      rating: 5,
      date: "a month ago",
      comment: "Celebrated my sister's birthday here. The team was super polite and cooperative! They arranged the table beautifully and the Chicken Cheese Burger and Steamed Momos with clear soup were fresh and hot. 10/10 recommend!",
      favoriteDish: "Steamed Momos with Soup"
    },
    {
      id: "rev-3",
      name: "Debanjan Mukherjee",
      rating: 5,
      date: "3 weeks ago",
      comment: "The best place around Baguiati to watch live cricket matches while enjoying piping hot Maggi and club sandwiches. Air conditioning is great, staff is courteous, and the prices are super fair for college students.",
      favoriteDish: "Chicken Chilli Garlic Maggi & Club Sandwich"
    },
    {
      id: "rev-4",
      name: "Ananya Bhattacharya",
      rating: 4,
      date: "2 months ago",
      comment: "Loved the food and peaceful ambiance. The chocolate cheese sandwich was a pleasant surprise! Nice music in the background and very hygienic place. Will definitely visit again.",
      favoriteDish: "TSG Special Baked Pasta"
    }
  ] as Review[],

  seo: {
    title: "The Spicy Garden - Cafe & Bistro | Baguiati Kolkata",
    metaDescription: "The Spicy Garden Cafe & Bistro in Ashwini Nagar, Baguiati, Kolkata. Delicious pizzas, pastas, burgers, Maggi, momos, and celebrations. Book birthdays & parties. Call 8777866602.",
    keywords: [
      "Spicy Garden Cafe & Resto",
      "The Spicy Garden Cafe & Bistro",
      "Cafe in Baguiati",
      "Restaurants in Ashwini Nagar Kolkata",
      "Best cafe near VIP road Kolkata",
      "Pocket friendly cafe Kolkata",
      "Birthday celebration cafe Baguiati",
      "Pizza burger momos Baguiati Kolkata",
      "The Spicy Garden 8777866602"
    ],
    canonicalUrl: "https://spicygardencafe.com",
    ogImage: "/unnamed (2).webp",
    locale: "en_IN",
    siteName: "The Spicy Garden Cafe & Bistro"
  }
};

/**
 * Helper to check if the restaurant is currently open based on Indian Standard Time (IST: UTC+5:30)
 */
export function getRestaurantCurrentStatus(): {
  isOpen: boolean;
  statusText: string;
  nextStatusText: string;
  badgeColorClass: string;
  todayHoursDisplay: string;
  currentDayName: string;
  dayOfWeek: number;
} {
  // Current time in IST (UTC+5:30)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));
  
  const dayOfWeek = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const currentHours = istTime.getHours() + (istTime.getMinutes() / 60);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayNames[dayOfWeek];

  // Friday: 1:00 PM - 11:00 PM (13:00 - 23:00)
  // Monday-Thursday, Saturday-Sunday: 2:00 PM - 11:30 PM (14:00 - 23:30)
  const isFriday = dayOfWeek === 5;
  const openTime = isFriday ? RESTAURANT_DATA.timings.fridayOpenHour24 : RESTAURANT_DATA.timings.regularOpenHour24;
  const closeTime = isFriday ? RESTAURANT_DATA.timings.fridayCloseHour24 : RESTAURANT_DATA.timings.regularCloseHour24;
  const openTimeText = isFriday ? "1:00 PM" : "2:00 PM";
  const closeTimeText = isFriday ? "11:00 PM" : "11:30 PM";
  const todayHoursDisplay = `${openTimeText} – ${closeTimeText}`;

  // Tomorrow's opening time in case restaurant is closed for the day
  const tomorrowDay = (dayOfWeek + 1) % 7;
  const tomorrowOpenText = tomorrowDay === 5 ? "1:00 PM" : "2:00 PM";

  if (currentHours >= openTime && currentHours < closeTime) {
    const isClosingSoon = currentHours >= (closeTime - 0.75); // last 45 minutes
    return {
      isOpen: true,
      statusText: isClosingSoon ? "Open Now (Kitchen Closes Soon)" : "Open Now",
      nextStatusText: `Closes at ${closeTimeText}`,
      badgeColorClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      todayHoursDisplay,
      currentDayName,
      dayOfWeek
    };
  } else {
    const opensToday = currentHours < openTime;
    return {
      isOpen: false,
      statusText: "Currently Closed",
      nextStatusText: opensToday ? `Opens Today at ${openTimeText}` : `Opens Tomorrow at ${tomorrowOpenText}`,
      badgeColorClass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      todayHoursDisplay,
      currentDayName,
      dayOfWeek
    };
  }
}

/**
 * Helper to generate Schema.org JSON-LD structured data for Google Local Business
 */
export function getRestaurantStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "CafeOrCoffeeShop"],
    "@id": `${RESTAURANT_DATA.seo.canonicalUrl}/#restaurant`,
    "name": RESTAURANT_DATA.brand.name,
    "alternateName": [RESTAURANT_DATA.brand.shortName, RESTAURANT_DATA.brand.altName],
    "image": [
      `${RESTAURANT_DATA.seo.canonicalUrl}${RESTAURANT_DATA.assets.heroPizza}`,
      `${RESTAURANT_DATA.seo.canonicalUrl}${RESTAURANT_DATA.assets.diningHallMural}`,
      `${RESTAURANT_DATA.seo.canonicalUrl}${RESTAURANT_DATA.assets.storefrontBanner}`
    ],
    "logo": `${RESTAURANT_DATA.seo.canonicalUrl}${RESTAURANT_DATA.assets.logo}`,
    "url": RESTAURANT_DATA.seo.canonicalUrl,
    "telephone": RESTAURANT_DATA.contact.displayPhone,
    "email": RESTAURANT_DATA.contact.email,
    "priceRange": RESTAURANT_DATA.stats.pricePerPerson,
    "servesCuisine": ["Cafe", "Fast Food", "Italian", "Chinese", "Tibetan", "Continental"],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": RESTAURANT_DATA.contact.address.street,
      "addressLocality": RESTAURANT_DATA.contact.address.locality,
      "addressRegion": RESTAURANT_DATA.contact.address.state,
      "postalCode": RESTAURANT_DATA.contact.address.postalCode,
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": RESTAURANT_DATA.contact.geo.latitude,
      "longitude": RESTAURANT_DATA.contact.geo.longitude
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Saturday",
          "Sunday"
        ],
        "opens": "14:00",
        "closes": "23:30"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Friday"
        ],
        "opens": "13:00",
        "closes": "23:00"
      }
    ],
    "sameAs": [
      RESTAURANT_DATA.contact.socials.instagram.url
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": RESTAURANT_DATA.stats.averageRating,
      "reviewCount": "250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "hasMenu": `${RESTAURANT_DATA.seo.canonicalUrl}/#menu`,
    "acceptsReservations": "True"
  };
}
