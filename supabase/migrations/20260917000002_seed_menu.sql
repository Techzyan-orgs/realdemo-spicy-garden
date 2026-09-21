-- =============================================================================
-- Migration: 20260917000002_seed_menu.sql
-- Seeds default menu categories and items from The Spicy Garden catalog
-- =============================================================================

-- 1. Insert Categories
INSERT INTO public.menu_categories (id, label, icon, subtitle, description, image_url, sort_order, is_active)
VALUES
('pizza', 'Pizzas', 'Pizza', '11 Handcrafted Pizzas • Starting at ₹149', 'Hand-stretched golden crusts smothered in rich Italian marinara, loaded mozzarella, and fresh gourmet toppings.', '/unnamed (2).webp', 1, true),
('pasta', 'Pastas', 'Bowl', '4 Italian Penne Classics • Starting at ₹129', 'Al dente penne bathed in velvety Alfredo white sauce, zesty Arrabbiata red sauce, or chef secret baked pink sauce.', '/pasta.webp', 2, true),
('burger', 'Burgers', 'Sandwich', '9 Stacked Gourmet Burgers • Starting at ₹79', 'Crispy fried and grilled cutlets with melted cheese slices, fresh garden relish, and bistro sauce in toasted sesame buns.', '/unnamed (3).webp', 3, true),
('maggi', 'Maggi Specials', 'Soup', '8 Street-Style Noodle Bowls • Starting at ₹69', 'Comforting 2-minute Kolkata cafe-style noodles elevated with fiery garlic chilli, golden sweet corn, and double cheese.', '/maggi.webp', 4, true),
('sandwich', 'Sandwiches & Clubs', 'Layers', '19 Toasted & Club Grills • Starting at ₹79', 'Triple-decker toasted club sandwiches, golden corn cheese grills, spiced paneer tikka melts, and loaded cheese toasts.', '/sandwich.webp', 5, true),
('chinese_specials', 'Chinese & Starters', 'Flame', '3 Street-Style Specialties • Starting at ₹129', 'Authentic Tibetan steamed momos served with fiery red dip & clear soup, crispy chicken strips, and wok-tossed fried rice.', '/unnamed (6).webp', 6, true)
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

-- 2. Insert Menu Items
-- PIZZAS
INSERT INTO public.menu_items (id, category_id, name, description, price, chicken_price, is_veg, is_spicy, is_bestseller, is_special, image_url, tags, is_available, sort_order)
VALUES
('piz-1', 'pizza', 'Veg Cheese Pizza', 'Classic golden crust loaded with savory tomato concassé and melted mozzarella cheese.', 149, NULL, true, false, false, false, NULL, ARRAY['Classic', 'Bestseller'], true, 1),
('piz-2', 'pizza', 'Cheese Corn Pizza', 'Sweet American golden corn kernels layered generously with double mozzarella.', 169, NULL, true, false, false, false, NULL, ARRAY['Kids Favorite'], true, 2),
('piz-3', 'pizza', 'Mushroom Cheese Pizza', 'Sautéed fresh button mushrooms infused with Italian herbs and gooey molten cheese.', 169, NULL, true, false, false, false, NULL, ARRAY['Herbaceous'], true, 3),
('piz-4', 'pizza', 'Paneer Pizza', 'Tender cubes of fresh cottage cheese, diced onions, green peppers, and rich tomato reduction.', 179, NULL, true, false, false, false, NULL, ARRAY['Vegetarian Delight'], true, 4),
('piz-5', 'pizza', 'Cheese Burst Pizza', 'Crust oozing with liquid molten cheese and topped with a lavish layer of browned mozzarella.', 199, 259, true, false, true, false, NULL, ARRAY['Cheese Lovers', 'Super Cheesy'], true, 5),
('piz-6', 'pizza', 'Paneer Tikka Pizza', 'Marinated smoky tandoori paneer cubes, capsicum, red onions, and Indian spiced marinara.', 199, 219, true, true, false, false, NULL, ARRAY['Desi Fusion', 'Spicy'], true, 6),
('piz-7', 'pizza', 'Chicken Pizza', 'Juicy herb-seasoned chicken chunks, melted cheese, and aromatic oregano toppings.', 199, NULL, false, false, false, false, NULL, ARRAY['Chef Special'], true, 7),
('piz-8', 'pizza', 'Chicken Tikka Pizza', 'Smoky clay-oven spiced chicken tikka strips with crunchy onions, green capsicum, and chilli flakes.', 219, NULL, false, true, true, false, NULL, ARRAY['Must Try', 'Spicy'], true, 8),
('piz-9', 'pizza', 'Chicken Cheese Burst Pizza', 'The ultimate indulgence — molten cheese volcano crust loaded with tender spiced chicken.', 259, NULL, false, false, false, true, NULL, ARRAY['Decadent', 'House Favorite'], true, 9),
('piz-10', 'pizza', 'TSG''s Special [Veg] Pizza', 'The Spicy Garden signature vegetarian master creation: overloaded with paneer, mushrooms, sweet corn, black olives, bell peppers, and triple cheese blend.', 269, NULL, true, false, false, true, '/unnamed (2).webp', ARRAY['Signature Special', 'Fully Loaded'], true, 10),
('piz-11', 'pizza', 'TSG''s Special [Chicken] Pizza', 'The crown jewel of The Spicy Garden: loaded with grilled chicken, chicken tikka, black olives, onions, paprika, and supreme cheese blend.', 289, NULL, false, false, true, true, '/unnamed (2).webp', ARRAY['Signature Special', 'Star Dish'], true, 11),

-- PASTAS
('pas-1', 'pasta', 'White Sauce Pasta (Alfredo Style)', 'Al dente penne bathed in a luscious, velvety cream sauce with butter, garlic, herbs, and parmesan.', 129, 149, true, false, true, false, NULL, ARRAY['Creamy Alfredo'], true, 12),
('pas-2', 'pasta', 'Red Sauce Pasta (Arrabbiata Style)', 'Zesty Italian plum tomato sauce simmered with crushed garlic, extra virgin olive oil, and fiery red chilli flakes.', 129, 149, true, true, false, false, NULL, ARRAY['Tangy & Spicy'], true, 13),
('pas-3', 'pasta', 'Mix Sauce Pasta (Pink Sauce Rosa)', 'The perfect symphony of rich white cream and robust tangy arrabbiata sauce, tossed with crisp seasonal vegetables.', 129, 149, true, false, true, false, NULL, ARRAY['Best of Both'], true, 14),
('pas-4', 'pasta', 'TSG''s Special Baked Pasta', 'Oven-baked penne layered with chef secret spiced sauce, extra toppings, and a thick golden gratin cheese crust.', 179, 199, true, false, false, true, NULL, ARRAY['Oven Baked', 'Signature'], true, 15),

-- BURGERS
('bur-1', 'burger', 'Veg Burger', 'Crisp seasoned vegetable patty tucked into a soft toasted bun with tomato, onion, and herb mayo.', 79, NULL, true, false, false, false, NULL, ARRAY['Value Pick'], true, 16),
('bur-2', 'burger', 'Veg Cheese Burger', 'Crispy veg patty crowned with melted processed cheese slice and sweet and tangy relish.', 99, NULL, true, false, false, false, '/unnamed (3).webp', ARRAY['Bestseller'], true, 17),
('bur-3', 'burger', 'Veg Double Cheese Burger', 'Double layers of decadent cheese enveloping a seasoned golden crunchy patty with fresh iceberg lettuce.', 109, NULL, true, false, false, false, NULL, ARRAY['Extra Cheesy'], true, 18),
('bur-4', 'burger', 'Chicken Burger', 'Juicy, spiced minced chicken patty grilled to perfection with onions, tomatoes, and house mustard dressing.', 119, NULL, false, false, false, false, NULL, ARRAY['Classic Meat'], true, 19),
('bur-5', 'burger', 'Paneer Cheese Burger', 'Thick spiced paneer steak layered with garlic herb butter, melted cheese, and crunchy veggies.', 119, NULL, true, false, false, false, NULL, ARRAY['Vegetarian Power'], true, 20),
('bur-6', 'burger', 'Chicken Cheese Burger', 'Crispy succulent chicken patty hugged by a warm melted cheddar cheese blanket and house special dressing.', 129, NULL, false, false, true, false, '/unnamed (3).webp', ARRAY['Top Favorite'], true, 21),
('bur-7', 'burger', 'Veg King Kong Cheese Burger', 'Jumbo double vegetable patties stacked with extra cheese, pickles, lettuce, and secret smoky sauce.', 129, NULL, true, false, false, true, NULL, ARRAY['Monster Size'], true, 22),
('bur-8', 'burger', 'TSG''s Special [Veg] Burger', 'Chef gourmet tower with paneer and spiced potato cutlet, jalapenos, cheese blast, and spicy garden dressing.', 139, NULL, true, false, false, true, NULL, ARRAY['Signature Special'], true, 23),
('bur-9', 'burger', 'TSG''s Special [Chicken] Burger', 'The ultimate meat lover burger: crispy chicken fillet + seasoned patty, double cheese, caramelized onions, and signature sauce.', 149, NULL, false, false, true, true, NULL, ARRAY['Signature Special', 'Crowd Pleaser'], true, 24),

-- MAGGI SPECIALS
('mag-1', 'maggi', 'Veg Maggi', 'Classic comforting noodles tossed with fresh green peas, carrots, onions, and signature tastemaker spices.', 69, NULL, true, false, false, false, NULL, ARRAY['Soul Food', 'Pocket Friendly'], true, 25),
('mag-2', 'maggi', 'Veg Cheese Maggi', 'Steaming hot Maggi noodles infused with a silky blanket of melted cheese.', 89, NULL, true, false, true, false, NULL, ARRAY['Cheesy Comfort'], true, 26),
('mag-3', 'maggi', 'Cheese Corn Maggi', 'Sweet American corn paired with creamy molten cheese over perfectly simmered noodles.', 89, NULL, true, false, false, false, NULL, ARRAY['Sweet & Savory'], true, 27),
('mag-4', 'maggi', 'Veg Chilli Garlic Maggi', 'Spiced up with sautéed burnt garlic, fiery green chillies, and crushed black pepper.', 89, NULL, true, true, false, false, NULL, ARRAY['Spicy Kick'], true, 28),
('mag-5', 'maggi', 'Chicken Maggi', 'Tender shredded chicken morsels simmered right into aromatic spiced Maggi noodles.', 99, NULL, false, false, false, false, NULL, ARRAY['Protein Packed'], true, 29),
('mag-6', 'maggi', 'Chicken Chilli Garlic Maggi', 'Juicy shredded chicken tossed in wok-roasted garlic and crushed red peppers for a fiery bite.', 109, NULL, false, true, false, false, NULL, ARRAY['Hot & Spicy'], true, 30),
('mag-7', 'maggi', 'Chicken Cheese Maggi', 'Rich shredded chicken noodles draped in hot bubbling cheese — the college favorite.', 119, NULL, false, false, true, false, NULL, ARRAY['Super Hit'], true, 31),
('mag-8', 'maggi', 'TSG''s Special Baked Maggi', 'Our viral innovation: loaded Maggi baked casserole-style with molten cheese crust and crunchy toppings.', 129, 169, true, false, false, true, NULL, ARRAY['Oven Baked', 'Signature Special'], true, 32),

-- SANDWICHES & CLUBS
('san-1', 'sandwich', 'Veg Sandwich', 'Crisp toasted bread with cucumber, tomato, onion rings, and mint-coriander chutney.', 69, NULL, true, false, false, false, NULL, ARRAY['Light Bite'], true, 33),
('san-2', 'sandwich', 'Veg Cheese Sandwich', 'Fresh vegetable stuffing enriched with generous grated cheese, grilled golden-brown.', 79, NULL, true, false, false, false, NULL, ARRAY['Tea Time Favorite'], true, 34),
('san-3', 'sandwich', 'Cheese Corn Sandwich', 'Juicy sweet corn and creamy melted cheese grilled inside herb-buttered sandwich slices.', 89, NULL, true, false, false, false, NULL, ARRAY['Comforting'], true, 35),
('san-4', 'sandwich', 'Egg Cheese Sandwich', 'Fluffy seasoned egg omelette or boiled spiced egg with melting cheese and pepper.', 89, NULL, false, false, false, false, NULL, ARRAY['Breakfast Classic'], true, 36),
('san-5', 'sandwich', 'Chocolate Cheese Sandwich', 'Warm gooey dark chocolate spread paired with mild melted cheese for an addictive sweet-salty treat.', 89, NULL, true, false, false, true, NULL, ARRAY['Dessert Treat'], true, 37),
('san-6', 'sandwich', 'Chicken Sandwich', 'Juicy seasoned chicken breast slices with mayo and crunchy crisp lettuce.', 99, NULL, false, false, false, false, NULL, ARRAY['Hearty'], true, 38),
('san-7', 'sandwich', 'Bombay Masala Cheese Sandwich', 'Zesty spiced potato masala, beetroot, capsicum, tangy chaat masala, and melted cheese.', 99, NULL, true, true, false, false, NULL, ARRAY['Bombay Street Style'], true, 39),
('san-8', 'sandwich', 'Paneer Cheese Sandwich', 'Soft marinated paneer cubes tossed with capsicum and melted cheddar cheese.', 109, NULL, true, false, false, false, NULL, ARRAY['Rich & Filling'], true, 40),
('san-9', 'sandwich', 'Chicken Cheese Sandwich', 'Shredded roast chicken mixed with creamy herb mayonnaise and double melted cheese.', 109, NULL, false, false, true, false, NULL, ARRAY['Top Pick'], true, 41),
('san-10', 'sandwich', 'Egg Chicken Sandwich', 'Double protein power: tender chicken chunks paired with seasoned egg and black pepper.', 109, NULL, false, false, false, false, NULL, ARRAY['High Protein'], true, 42),
('san-11', 'sandwich', 'Egg Chicken Cheese Sandwich', 'Chicken, egg, and molten cheese toasted with butter to crisp perfection.', 119, NULL, false, false, false, false, NULL, ARRAY['Full Feast'], true, 43),
('san-12', 'sandwich', 'Tandoori Paneer Sandwich', 'Smoky tandoori marinated paneer with diced bell peppers and spicy mint mayo.', 119, NULL, true, true, false, false, NULL, ARRAY['Tandoori Twist'], true, 44),
('san-13', 'sandwich', 'Paneer Tikka Cheese Sandwich', 'Char-grilled paneer tikka slices layered with molten cheese and grilled crisp.', 129, NULL, true, true, false, false, NULL, ARRAY['Desi Gourmet'], true, 45),
('san-14', 'sandwich', 'Bombay Club Sandwich', 'Triple-decker toasted sandwich packed with masala aloo, cheese, veggies, and tangy Bombay green chutney.', 159, 179, true, false, true, false, NULL, ARRAY['Triple Decker', 'Bestseller'], true, 46),
('san-15', 'sandwich', 'American Club Sandwich', 'Classic American style 3-layer toasted sandwich with coleslaw, cheese, tomato, and chips.', 159, 179, true, false, false, false, NULL, ARRAY['Continental'], true, 47),
('san-16', 'sandwich', 'Paneer Club Sandwich', 'Three layers of toasted artisan bread stuffed with spiced paneer, grilled veggies, and cheese.', 169, NULL, true, false, false, false, NULL, ARRAY['Jumbo Veg'], true, 48),
('san-17', 'sandwich', 'Egg Chicken Club Sandwich', 'Three massive layers loaded with roasted chicken, spiced egg, double cheese, and crisp veggies.', 189, NULL, false, false, true, false, NULL, ARRAY['Triple Decker King'], true, 49),
('san-18', 'sandwich', 'TSG''s Special [Veg] Club Sandwich', 'The Spicy Garden signature triple-decker: paneer, cheese corn, roasted peppers, and chef secret dips.', 189, NULL, true, false, false, true, NULL, ARRAY['Signature Special'], true, 50),
('san-19', 'sandwich', 'TSG''s Special [Chicken] Club Sandwich', 'The ultimate club feast: barbecue shredded chicken, fried egg, double cheese, crisp greens, and spicy house sauce.', 199, NULL, false, false, true, true, NULL, ARRAY['Signature Special', 'Star Sandwich'], true, 51),

-- CHINESE & STARTERS
('chn-1', 'chinese_specials', 'Steamed Chicken / Veg Momos with Soup', '5 pieces of handcrafted Tibetan steamed dumplings served with piping hot clear herbal broth and fiery red chilli-garlic chutney.', 99, NULL, false, false, true, false, '/unnamed (6).webp', ARRAY['Bestseller', 'Steaming Hot'], true, 52),
('chn-2', 'chinese_specials', 'Golden Crispy Fried Chicken Tenders', 'Marinated tender chicken strips coated in seasoned panko breadcrumbs, deep-fried golden, and paired with spicy dipping salsa.', 149, NULL, false, false, true, false, '/unnamed (5).webp', ARRAY['Crispy Crunch', 'Finger Food'], true, 53),
('chn-3', 'chinese_specials', 'Indo-Chinese Fried Rice & Chilli Chicken Combo', 'Wok-tossed aromatic egg-chicken or veg fried rice served alongside rich, glossy Kolkata-style chilli chicken gravy with capsicum and spring onions.', 199, NULL, false, true, true, true, '/unnamed (4).webp', ARRAY['Combo Meal', 'Crowd Favorite'], true, 54)

ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    chicken_price = EXCLUDED.chicken_price,
    is_veg = EXCLUDED.is_veg,
    is_spicy = EXCLUDED.is_spicy,
    is_bestseller = EXCLUDED.is_bestseller,
    is_special = EXCLUDED.is_special,
    image_url = EXCLUDED.image_url,
    tags = EXCLUDED.tags,
    is_available = EXCLUDED.is_available,
    sort_order = EXCLUDED.sort_order;
