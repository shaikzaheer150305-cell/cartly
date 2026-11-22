export type StoreProduct = {
  id: string
  slug: string
  name: string
  category: string
  categorySlug: string
  price: number
  compareAt: number
  rating: number
  reviews: number
  description: string
  image: string
  images: string[]
  colors: { name: string; value: string }[]
  sizes?: string[]
  stock: number
  badge?: string
  createdAt: string
}

const photo = (id: string, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

export const products: StoreProduct[] = [
  { id: 'p01', slug: 'everyday-canvas-tote', name: 'Everyday Canvas Tote', category: 'Accessories', categorySlug: 'accessories', price: 1499, compareAt: 2099, rating: 4.9, reviews: 128, description: 'Roomy, considered, and ready for wherever the day goes. Made from sturdy cotton canvas with an inside pocket for the little things.', image: photo('photo-1590874103328-eac38a683ce7'), images: [photo('photo-1590874103328-eac38a683ce7'), photo('photo-1548036328-c9fa89d128fa')], colors: [{ name: 'Natural', value: '#d8c6a5' }, { name: 'Olive', value: '#68745b' }, { name: 'Ink', value: '#27313b' }], stock: 18, badge: 'Bestseller', createdAt: '2026-11-18' },
  { id: 'p02', slug: 'weekend-knit-sweater', name: 'Weekend Knit Sweater', category: 'Clothing', categorySlug: 'clothing', price: 4299, compareAt: 5499, rating: 4.8, reviews: 86, description: 'An easy layer in a soft, textured knit. Relaxed through the shoulders with ribbed cuffs and a clean crew neckline.', image: photo('photo-1576566588028-4147f3842f27'), images: [photo('photo-1576566588028-4147f3842f27'), photo('photo-1434389677669-e08b4cac3105')], colors: [{ name: 'Oat', value: '#d8c7aa' }, { name: 'Pine', value: '#53685a' }, { name: 'Berry', value: '#955c65' }], sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: 12, badge: 'Popular', createdAt: '2026-11-17' },
  { id: 'p03', slug: 'classic-leather-sneakers', name: 'Classic Leather Sneakers', category: 'Shoes', categorySlug: 'shoes', price: 5999, compareAt: 7999, rating: 4.7, reviews: 204, description: 'A clean everyday sneaker made for long walks and longer weekends. Cushioned footbed, soft leather upper, and a grippy natural rubber sole.', image: photo('photo-1542291026-7eec264c27ff'), images: [photo('photo-1542291026-7eec264c27ff'), photo('photo-1549298916-b41d501d3772')], colors: [{ name: 'Chalk', value: '#ebe7df' }, { name: 'Cedar', value: '#b66c44' }, { name: 'Moss', value: '#68745b' }], sizes: ['6', '7', '8', '9', '10', '11'], stock: 7, badge: 'Bestseller', createdAt: '2026-11-16' },
  { id: 'p04', slug: 'soft-structure-crossbody', name: 'Soft Structure Crossbody', category: 'Accessories', categorySlug: 'accessories', price: 3699, compareAt: 4599, rating: 4.8, reviews: 63, description: 'A hands-free daily companion with thoughtful compartments and a comfortable adjustable strap. Just enough room for your everyday essentials.', image: photo('photo-1584917865442-de89df76afd3'), images: [photo('photo-1584917865442-de89df76afd3'), photo('photo-1548036328-c9fa89d128fa')], colors: [{ name: 'Cognac', value: '#a85e3c' }, { name: 'Black', value: '#222222' }, { name: 'Sand', value: '#cabb9f' }], stock: 9, createdAt: '2026-11-15' },
  { id: 'p05', slug: 'studio-cotton-tee', name: 'Studio Cotton Tee', category: 'Clothing', categorySlug: 'clothing', price: 1299, compareAt: 1599, rating: 4.6, reviews: 147, description: 'The tee you reach for first. Cut from breathable organic cotton with a relaxed fit that works on its own or under your favorite layers.', image: photo('photo-1521572163474-6864f9cf17ab'), images: [photo('photo-1521572163474-6864f9cf17ab'), photo('photo-1503342217505-b0a15ec3261c')], colors: [{ name: 'White', value: '#f2f0eb' }, { name: 'Clay', value: '#b87863' }, { name: 'Ink', value: '#27313b' }], sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: 24, badge: 'New', createdAt: '2026-11-14' },
  { id: 'p06', slug: 'everyday-sunglasses', name: 'Everyday Sunglasses', category: 'Accessories', categorySlug: 'accessories', price: 2199, compareAt: 2799, rating: 4.5, reviews: 72, description: 'A timeless frame with warm tinted lenses and a lightweight feel. Comes with a soft protective pouch for days on the move.', image: photo('photo-1511499767150-a48a237f0083'), images: [photo('photo-1511499767150-a48a237f0083')], colors: [{ name: 'Tortoise', value: '#75503d' }, { name: 'Black', value: '#222222' }], stock: 15, createdAt: '2026-11-13' },
  { id: 'p07', slug: 'relaxed-linen-shirt', name: 'Relaxed Linen Shirt', category: 'Clothing', categorySlug: 'clothing', price: 3299, compareAt: 4299, rating: 4.8, reviews: 91, description: 'Lightweight linen with an easy drape that gets softer with every wear. A versatile button-up for slow mornings and warm evenings.', image: photo('photo-1598033129183-c4f50c736f10'), images: [photo('photo-1598033129183-c4f50c736f10'), photo('photo-1596755094514-f87e34085b2c')], colors: [{ name: 'Cloud', value: '#e9e5da' }, { name: 'Sky', value: '#91a9b8' }, { name: 'Sage', value: '#9aa58a' }], sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: 11, badge: 'New', createdAt: '2026-11-12' },
  { id: 'p08', slug: 'coastline-slide-sandal', name: 'Coastline Slide Sandal', category: 'Shoes', categorySlug: 'shoes', price: 1999, compareAt: 2599, rating: 4.6, reviews: 58, description: 'An uncomplicated warm-weather staple with a cushioned footbed and two soft, adjustable straps. Easy to wear from the city to the coast.', image: photo('photo-1603487742131-4160ec999306'), images: [photo('photo-1603487742131-4160ec999306')], colors: [{ name: 'Tan', value: '#b98158' }, { name: 'Black', value: '#222222' }], sizes: ['6', '7', '8', '9', '10'], stock: 5, badge: 'Almost gone', createdAt: '2026-11-11' },
  { id: 'p09', slug: 'weekender-duffel', name: 'Weekender Duffel', category: 'Accessories', categorySlug: 'accessories', price: 6499, compareAt: 8499, rating: 4.9, reviews: 42, description: 'A compact travel bag with a wide opening, padded carry handles, and a separate pocket for the things you need close by.', image: photo('photo-1553062407-98eeb64c6a62'), images: [photo('photo-1553062407-98eeb64c6a62')], colors: [{ name: 'Olive', value: '#68745b' }, { name: 'Navy', value: '#34445a' }], stock: 8, createdAt: '2026-11-10' },
  { id: 'p10', slug: 'soft-cotton-cap', name: 'Soft Cotton Cap', category: 'Accessories', categorySlug: 'accessories', price: 999, compareAt: 1299, rating: 4.5, reviews: 34, description: 'An everyday six-panel cap in brushed cotton twill. Finished with an adjustable back strap and a gently curved brim.', image: photo('photo-1588850561407-ed78c282e89b'), images: [photo('photo-1588850561407-ed78c282e89b')], colors: [{ name: 'Stone', value: '#d3cec1' }, { name: 'Forest', value: '#435849' }, { name: 'Navy', value: '#34445a' }], stock: 21, createdAt: '2026-11-09' },
  { id: 'p11', slug: 'modern-analog-watch', name: 'Modern Analog Watch', category: 'Accessories', categorySlug: 'accessories', price: 7499, compareAt: 9499, rating: 4.7, reviews: 66, description: 'A pared-back face, brushed case, and a comfortable strap make this an easy daily watch. Water resistant for everyday wear.', image: photo('photo-1524805444758-089113d48a6d'), images: [photo('photo-1524805444758-089113d48a6d')], colors: [{ name: 'Silver', value: '#adb5bd' }, { name: 'Gold', value: '#c1a268' }], stock: 6, createdAt: '2026-11-08' },
  { id: 'p12', slug: 'ribbed-tank-top', name: 'Ribbed Tank Top', category: 'Clothing', categorySlug: 'clothing', price: 1499, compareAt: 1899, rating: 4.6, reviews: 83, description: 'A soft, stretchy rib knit with a clean scoop neckline. Wear it solo on warm days or as a comfortable base layer year-round.', image: photo('photo-1503342217505-b0a15ec3261c'), images: [photo('photo-1503342217505-b0a15ec3261c')], colors: [{ name: 'Cream', value: '#e8e0d2' }, { name: 'Black', value: '#222222' }, { name: 'Rust', value: '#ac684f' }], sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: 16, createdAt: '2026-11-07' },
]

export const categories = [
  { name: 'Clothing', slug: 'clothing', image: photo('photo-1483985988355-763728e1935b', 700) },
  { name: 'Accessories', slug: 'accessories', image: photo('photo-1490481651871-ab68de25d43d', 700) },
  { name: 'Shoes', slug: 'shoes', image: photo('photo-1495555961986-6d4c1ecb7be3', 700) },
]
