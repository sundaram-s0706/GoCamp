if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/go-camp-maptiler';

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '69eb581c42794eed6d323207',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.Vitae, porro repellat ducimus ipsam placeat, repellendus accusantium quos illo harum, quam nihil rerum earum aperiam reiciendis architecto ut voluptas modi? Non!',
            price,
            images: [
                {
                    url: 'https://res.cloudinary.com/dwydmvmuq/image/upload/v1780067527/GoCamp/twpq9o6potvwldicqutk.jpg',
                    filename: 'GoCamp/twpq9o6potvwldicqutk',
                },
                {
                    url: 'https://res.cloudinary.com/dwydmvmuq/image/upload/v1780067527/GoCamp/zzsscujm8vyuzmwuojoh.jpg',
                    filename: 'GoCamp/zzsscujm8vyuzmwuojoh',
                }
            ]
        })
        await camp.save()
    }
}

mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 20000
})
    .then(() => {
        console.log("Mongoose connected");
        return seedDB();
    })
    .then(() => {
        console.log("Database seeded!");
        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Mongoose connection or seeding error:", err);
        process.exit(1);
    });