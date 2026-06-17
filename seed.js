const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Property = require("./models/Property");
const db = require("./models/db");

const hall = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600047509358-9e755f1e04e1?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&h=400&fit=crop",
];
const bedroom = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7a75b5?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=280&fit=crop",
];
const kitchen = [
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1613977257592-4870f396e5f5?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=400&h=280&fit=crop",
  "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?w=400&h=280&fit=crop",
];

const properties = [
  { title: "1BHK Apartment near Central Park", description: "Cozy 1BHK apartment with modern amenities, close to metro station and markets.", price: 8000, bedrooms: 1, bathrooms: 1, area: "450 sqft", address: "12, Park Street", city: "mumbai", state: "maharashtra", pincode: "400001" },
  { title: "2BHK Family Flat in Andheri", description: "Spacious 2BHK flat with balcony, near schools and hospitals.", price: 15000, bedrooms: 2, bathrooms: 2, area: "850 sqft", address: "45, Andheri West", city: "mumbai", state: "maharashtra", pincode: "400053" },
  { title: "Studio Room in Powai", description: "Fully furnished studio near Hiranandani Gardens, ideal for working professionals.", price: 12000, bedrooms: 1, bathrooms: 1, area: "350 sqft", address: "Hiranandani Estate", city: "mumbai", state: "maharashtra", pincode: "400076" },
  { title: "3BHK Luxury Apartment in Bandra", description: "Premium 3BHK with sea view, modern kitchen, gym and pool access.", price: 45000, bedrooms: 3, bathrooms: 3, area: "1400 sqft", address: "Bandra West Sea Face", city: "mumbai", state: "maharashtra", pincode: "400050" },
  { title: "2BHK Independent House in Dadar", description: "Independent house with garden, ample parking space, pet friendly.", price: 22000, bedrooms: 2, bathrooms: 2, area: "1000 sqft", address: "Dadar East", city: "mumbai", state: "maharashtra", pincode: "400014" },
  { title: "Budget 1RK in Borivali", description: "Affordable 1RK near national park, good for students and bachelors.", price: 5000, bedrooms: 1, bathrooms: 1, area: "250 sqft", address: "Borivali East, near Station", city: "mumbai", state: "maharashtra", pincode: "400066" },
  { title: "2BHK Flat in Connaught Place", description: "Prime location flat in the heart of Delhi, walking distance to metro.", price: 25000, bedrooms: 2, bathrooms: 2, area: "900 sqft", address: "CP, Outer Circle", city: "delhi", state: "delhi", pincode: "110001" },
  { title: "1BHK in Dwarka Sector 12", description: "Well-ventilated 1BHK with 24hr water and security.", price: 9000, bedrooms: 1, bathrooms: 1, area: "500 sqft", address: "Sector 12, Dwarka", city: "delhi", state: "delhi", pincode: "110075" },
  { title: "3BHK Penthouse in Greater Kailash", description: "Luxurious 3BHK penthouse with terrace garden and servant room.", price: 55000, bedrooms: 3, bathrooms: 3, area: "1800 sqft", address: "GK-1, M Block", city: "delhi", state: "delhi", pincode: "110048" },
  { title: "Studio in Saket", description: "Compact studio near Select Citywalk mall, ideal for couples.", price: 11000, bedrooms: 1, bathrooms: 1, area: "300 sqft", address: "Saket District Centre", city: "delhi", state: "delhi", pincode: "110017" },
  { title: "1BHK in Indiranagar", description: "Modern 1BHK in Bangalore's most lively neighborhood, close to pubs and tech parks.", price: 14000, bedrooms: 1, bathrooms: 1, area: "550 sqft", address: "100 Feet Road, Indiranagar", city: "bangalore", state: "karnataka", pincode: "560038" },
  { title: "2BHK in Whitefield", description: "Spacious 2BHK near ITPL, gated community with pool and gym.", price: 18000, bedrooms: 2, bathrooms: 2, area: "950 sqft", address: "Whitefield Main Road", city: "bangalore", state: "karnataka", pincode: "560066" },
  { title: "3BHK Villa in Koramangala", description: "Beautiful 3BHK villa with private garden, parking for 2 cars.", price: 35000, bedrooms: 3, bathrooms: 3, area: "1500 sqft", address: "5th Block, Koramangala", city: "bangalore", state: "karnataka", pincode: "560095" },
  { title: "PG Room in HSR Layout", description: "Single occupancy PG room with food included, near bus stop.", price: 7000, bedrooms: 1, bathrooms: 1, area: "180 sqft", address: "HSR Layout Sector 3", city: "bangalore", state: "karnataka", pincode: "560102" },
  { title: "1BHK in T Nagar", description: "Budget-friendly 1BHK in Chennai's commercial hub.", price: 8500, bedrooms: 1, bathrooms: 1, area: "400 sqft", address: "T Nagar, Near Pondy Bazaar", city: "chennai", state: "tamil nadu", pincode: "600017" },
  { title: "2BHK in OMR", description: "New 2BHK flat along OMR, close to IT companies and shuttle service.", price: 16000, bedrooms: 2, bathrooms: 2, area: "900 sqft", address: "Old Mahabalipuram Road", city: "chennai", state: "tamil nadu", pincode: "600096" },
  { title: "3BHK in Adyar", description: "Spacious 3BHK near beach, quiet and green locality.", price: 28000, bedrooms: 3, bathrooms: 2, area: "1200 sqft", address: "Adyar, Besant Nagar Road", city: "chennai", state: "tamil nadu", pincode: "600020" },
  { title: "1BHK in Park Street", description: "Heritage building apartment on iconic Park Street, close to nightlife.", price: 12000, bedrooms: 1, bathrooms: 1, area: "500 sqft", address: "Park Street", city: "kolkata", state: "west bengal", pincode: "700016" },
  { title: "2BHK in Salt Lake Sector 5", description: "Modern 2BHK in Salt Lake IT hub, excellent connectivity.", price: 15000, bedrooms: 2, bathrooms: 2, area: "800 sqft", address: "Sector 5, Salt Lake City", city: "kolkata", state: "west bengal", pincode: "700091" },
  { title: "1BHK in Jubilee Hills", description: "Premium 1BHK in upscale Jubilee Hills, near film nagar.", price: 18000, bedrooms: 1, bathrooms: 1, area: "600 sqft", address: "Road 36, Jubilee Hills", city: "hyderabad", state: "telangana", pincode: "500033" },
  { title: "2BHK in Gachibowli", description: "2BHK near Financial District, gated community with amenities.", price: 20000, bedrooms: 2, bathrooms: 2, area: "1000 sqft", address: "Gachibowli Main Road", city: "hyderabad", state: "telangana", pincode: "500032" },
  { title: "3BHK in Hitech City", description: "Luxury 3BHK walking distance to Hitech City metro.", price: 38000, bedrooms: 3, bathrooms: 3, area: "1600 sqft", address: "Hitech City", city: "hyderabad", state: "telangana", pincode: "500081" },
  { title: "1BHK in SG Highway", description: "Modern 1BHK along SG Highway, close to shopping malls.", price: 10000, bedrooms: 1, bathrooms: 1, area: "475 sqft", address: "SG Highway", city: "ahmedabad", state: "gujarat", pincode: "380015" },
  { title: "2BHK in CG Road", description: "Prime location 2BHK on CG Road, heart of Ahmedabad.", price: 16000, bedrooms: 2, bathrooms: 2, area: "850 sqft", address: "CG Road", city: "ahmedabad", state: "gujarat", pincode: "380009" },
  { title: "1BHK in Gomti Nagar", description: "Well-maintained 1BHK in Lucknow's posh area.", price: 7500, bedrooms: 1, bathrooms: 1, area: "425 sqft", address: "Gomti Nagar Extension", city: "lucknow", state: "uttar pradesh", pincode: "226010" },
  { title: "2BHK in Hazratganj", description: "Heritage 2BHK near Hazratganj market, old charm with modern touches.", price: 12000, bedrooms: 2, bathrooms: 1, area: "750 sqft", address: "Hazratganj", city: "lucknow", state: "uttar pradesh", pincode: "226001" },
  { title: "1BHK near DB Mall", description: "Modern 1BHK near DB City Mall, prime location with all amenities nearby.", price: 7000, bedrooms: 1, bathrooms: 1, area: "450 sqft", address: "Zone-I, MP Nagar", city: "bhopal", state: "madhya pradesh", pincode: "462011" },
  { title: "2BHK in Arera Colony", description: "Spacious 2BHK in posh Arera Colony, close to schools and hospitals.", price: 13000, bedrooms: 2, bathrooms: 2, area: "850 sqft", address: "Arera Colony", city: "bhopal", state: "madhya pradesh", pincode: "462016" },
  { title: "3BHK near Bharat Bhavan", description: "Beautiful 3BHK near Bharat Bhavan with lake view, peaceful locality.", price: 20000, bedrooms: 3, bathrooms: 2, area: "1200 sqft", address: "Shyamla Hills", city: "bhopal", state: "madhya pradesh", pincode: "462002" },
  { title: "1RK in New Market", description: "Affordable 1RK near New Market area, walking distance to Bus Stand.", price: 4500, bedrooms: 1, bathrooms: 1, area: "250 sqft", address: "New Market", city: "bhopal", state: "madhya pradesh", pincode: "462003" },
  { title: "2BHK in Kolar Road", description: "Newly built 2BHK on Kolar Road, gated society with park.", price: 11000, bedrooms: 2, bathrooms: 2, area: "780 sqft", address: "Kolar Road", city: "bhopal", state: "madhya pradesh", pincode: "462042" },
  { title: "1BHK in Vijay Nagar", description: "Modern 1BHK in Vijay Nagar, close to IIT Indore and Bombay Hospital.", price: 8000, bedrooms: 1, bathrooms: 1, area: "500 sqft", address: "Scheme 54, Vijay Nagar", city: "indore", state: "madhya pradesh", pincode: "452010" },
  { title: "2BHK near Palasia Square", description: "Prime location 2BHK near Palasia Square, heart of Indore city.", price: 15000, bedrooms: 2, bathrooms: 2, area: "900 sqft", address: "Palasia", city: "indore", state: "madhya pradesh", pincode: "452001" },
  { title: "3BHK in Scheme 78", description: "Luxury 3BHK in upscale Scheme 78, modern amenities and clubhouse.", price: 28000, bedrooms: 3, bathrooms: 3, area: "1400 sqft", address: "Scheme 78, MR-10", city: "indore", state: "madhya pradesh", pincode: "452010" },
  { title: "Studio in BRTS Corridor", description: "Compact studio along BRTS route, easy commute to entire city.", price: 5500, bedrooms: 1, bathrooms: 1, area: "300 sqft", address: "BRTS Corridor, near RK Puram", city: "indore", state: "madhya pradesh", pincode: "452015" },
  { title: "2BHK in Annapurna", description: "Well-ventilated 2BHK near Annapurna Mandir, family-friendly area.", price: 12000, bedrooms: 2, bathrooms: 2, area: "820 sqft", address: "Annapurna Road", city: "indore", state: "madhya pradesh", pincode: "452009" },
];

async function seed() {
  try {
    let owner = await User.findOne({ email: "owner@easyhomes.com" });
    if (!owner) {
      const hashed = await bcrypt.hash("owner123", 10);
      owner = await User.create({
        name: "Demo Owner",
        email: "owner@easyhomes.com",
        password: hashed,
        phone: "9876543210",
        role: "owner",
      });
      console.log("Created demo owner: owner@easyhomes.com / owner123");
    } else {
      console.log("Demo owner already exists");
    }

    await db.properties.remove({}, { multi: true });
    console.log("Cleared existing properties");

    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      await Property.create({
        owner: owner._id,
        title: p.title,
        description: p.description,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        area: p.area,
        address: p.address,
        city: p.city,
        state: p.state,
        pincode: p.pincode,
        ownerContactRevealPrice: Math.floor(Math.random() * 80) + 30,
        images: {
          hall: hall[i % hall.length],
          bedroom: bedroom[i % bedroom.length],
          kitchen: kitchen[i % kitchen.length],
        },
      });
    }
    console.log("Seeded " + properties.length + " properties with real Unsplash photos!");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

seed().then(() => process.exit(0));
