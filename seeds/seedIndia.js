if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const Campground = require('../models/campground');
const User = require('../models/user');
const { descriptors, places } = require('./seedHelpers');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/go-camp-maptiler';
mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 20000
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const sample = array => array[Math.floor(Math.random() * array.length)];

// Real major Indian cities, with approximate coordinates.
// [longitude, latitude] order, matching GeoJSON Point convention used by your schema.
const indiaAreas = [
    { name: 'Mumbai, Maharashtra', lng: 72.8777, lat: 19.0760 },
    { name: 'New Delhi, Delhi', lng: 77.1025, lat: 28.7041 },
    { name: 'Bangalore, Karnataka', lng: 77.5946, lat: 12.9716 },
    { name: 'Chennai, Tamil Nadu', lng: 80.2707, lat: 13.0827 },
    { name: 'Kolkata, West Bengal', lng: 88.3639, lat: 22.5726 },
    { name: 'Hyderabad, Telangana', lng: 78.4867, lat: 17.3850 },
    { name: 'Pune, Maharashtra', lng: 73.8567, lat: 18.5204 },
    { name: 'Ahmedabad, Gujarat', lng: 72.5714, lat: 23.0225 },
    { name: 'Jaipur, Rajasthan', lng: 75.7873, lat: 26.9124 },
    { name: 'Surat, Gujarat', lng: 72.8311, lat: 21.1702 },
    { name: 'Lucknow, Uttar Pradesh', lng: 80.9462, lat: 26.8467 },
    { name: 'Kanpur, Uttar Pradesh', lng: 80.3319, lat: 26.4499 },
    { name: 'Nagpur, Maharashtra', lng: 79.0882, lat: 21.1458 },
    { name: 'Indore, Madhya Pradesh', lng: 75.8577, lat: 22.7196 },
    { name: 'Bhopal, Madhya Pradesh', lng: 77.4126, lat: 23.2599 },
    { name: 'Patna, Bihar', lng: 85.1376, lat: 25.5941 },
    { name: 'Vadodara, Gujarat', lng: 73.1812, lat: 22.3072 },
    { name: 'Ludhiana, Punjab', lng: 75.8573, lat: 30.9010 },
    { name: 'Agra, Uttar Pradesh', lng: 78.0081, lat: 27.1767 },
    { name: 'Nashik, Maharashtra', lng: 73.7898, lat: 19.9975 },
    { name: 'Chandigarh', lng: 76.7794, lat: 30.7333 },
    { name: 'Coimbatore, Tamil Nadu', lng: 76.9558, lat: 11.0168 },
    { name: 'Kochi, Kerala', lng: 76.2673, lat: 9.9312 },
    { name: 'Guwahati, Assam', lng: 91.7362, lat: 26.1445 },
    { name: 'Bhubaneswar, Odisha', lng: 85.8245, lat: 20.2961 },
    { name: 'Visakhapatnam, Andhra Pradesh', lng: 83.2185, lat: 17.6868 },
    { name: 'Panaji, Goa', lng: 73.8278, lat: 15.4909 },
    { name: 'Shimla, Himachal Pradesh', lng: 77.1734, lat: 31.1048 },
    { name: 'Dehradun, Uttarakhand', lng: 78.0322, lat: 30.3165 },
    { name: 'Amritsar, Punjab', lng: 74.8723, lat: 31.6340 },
    { name: 'Rishikesh, Uttarakhand', lng: 78.2676, lat: 30.0869 },
    { name: 'Manali, Himachal Pradesh', lng: 77.1892, lat: 32.2432 },
    { name: 'Udaipur, Rajasthan', lng: 73.7125, lat: 24.5854 },
];

// A handful of the original Thane, Maharashtra localities, kept so Thane
// still shows up on the map alongside the rest of India.
const thaneAreas = [
    { name: 'Thane West', lng: 72.9781, lat: 19.2183 },
    { name: 'Yeoor Hills, Thane', lng: 72.9930, lat: 19.2280 },
    { name: 'Ghodbunder Road, Thane', lng: 72.9489, lat: 19.2436 },
    { name: 'Upvan Lake, Thane', lng: 72.9750, lat: 19.2260 },
    { name: 'Hiranandani Estate, Thane', lng: 72.9700, lat: 19.2480 },
    { name: 'Kalwa, Thane', lng: 73.0070, lat: 19.1880 },
];

// Combined pool to sample from for each new campground.
const allAreas = [...indiaAreas, ...thaneAreas];

// Images to distribute across the seeded campgrounds
const newImages = [
    {
        url: 'https://res.cloudinary.com/dwydmvmuq/image/upload/v1782891872/how-to-create-a-cozy-campsite-NR_qbh8ve.jpg',
        filename: 'how-to-create-a-cozy-campsite-NR_qbh8ve',
    },
    {
        url: 'https://res.cloudinary.com/dwydmvmuq/image/upload/v1786220755/21_Glamping_Aesthetic_Ideas_to_Transform_Your_Outdoor_Getaway_into_a_Cozy_Paradise_-_Wanderland_Xperience_fcddkp.jpg',
        filename: '21_Glamping_Aesthetic_Ideas_to_Transform_Your_Outdoor_Getaway_into_a_Cozy_Paradise_-_Wanderland_Xperience_fcddkp',
    },
];

const seedDB = async () => {
    // 1. Remove ALL existing campgrounds
    const deleteResult = await Campground.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing campgrounds.`);

    // 2. Find any existing user to act as author
    const user = await User.findOne({});
    if (!user) {
        console.log('No users found in the database — register a user first, then re-run this script.');
        await mongoose.connection.close();
        return;
    }
    console.log(`Using existing user "${user.username}" (${user._id}) as author.`);

    // 3. Create 50 new campgrounds spread across India (plus a few in Thane)
    for (let i = 0; i < 50; i++) {
        const area = sample(allAreas);
        const price = Math.floor(Math.random() * 20) + 10;

        // Small random jitter so coordinates aren't all identical for the same city
        const jitter = () => (Math.random() - 0.5) * 0.08;

        const camp = new Campground({
            author: user._id,
            location: area.name,
            geometry: {
                type: 'Point',
                coordinates: [area.lng + jitter(), area.lat + jitter()]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae, porro repellat ducimus ipsam placeat, repellendus accusantium quos illo harum, quam nihil rerum earum aperiam reiciendis architecto ut voluptas modi? Non!',
            price,
            // Fixed order for every campground: the cozy campsite photo is
            // always images[0] (the thumbnail on campgrounds/index.ejs), the
            // hammock/lake photo is always images[1] (second carousel slide).
            images: [newImages[0], newImages[1]]
        });
        await camp.save();
    }
    console.log('Created 50 new campgrounds across India.');
};

seedDB().then(() => {
    mongoose.connection.close();
});