import { useState, useEffect } from 'react';
import { Plane, MapPin, Calendar, Users, DollarSign, Star, Clock } from 'lucide-react';
import { vacationService } from '../services/api';

const FIXED_PACKAGES = [
  {
    id: 1,
    name: "Gokarna Adventure Package",
    destination: "Gokarna, Karnataka",
    days: 3,
    nights: 2,
    price: 8500,
    image: "/assets/packages/gokarna.png",
    description: "Experience the spiritual and adventurous side of Gokarna with this 3-day package",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "7:00 AM", activity: "Pickup from Hubli/Dharwad", icon: "🚗" },
          { time: "8:30 AM", activity: "Breakfast at local restaurant", icon: "🍳" },
          { time: "10:00 AM", activity: "Visit Mahabaleshwar Temple", icon: "🛕" },
          { time: "11:30 AM", activity: "Beach and water activities at Om Beach", icon: "🏖️" },
          { time: "2:00 PM", activity: "Lunch at beachside restaurant", icon: "🍽️" },
          { time: "4:00 PM", activity: "Visit hidden beaches (Kudle, Paradise, Half Moon)", icon: "🌊" },
          { time: "6:00 PM", activity: "Ride to Honnavar", icon: "🚗" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "6:00 AM", activity: "Breakfast and visit Murdeshwara Shiva Temple", icon: "🛕" },
          { time: "9:00 AM", activity: "Visit famous beach and water activities", icon: "🏖️" },
          { time: "11:00 AM", activity: "Water sports (optional)", icon: "🏄" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Back to Honnavar", icon: "🚗" },
          { time: "5:00 PM", activity: "Honnavar backwaters boating", icon: "🚤" },
          { time: "7:00 PM", activity: "Tea and snacks", icon: "🍵" },
          { time: "9:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "6:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "8:00 AM", activity: "Check-out and back to Hubli", icon: "🚗" },
          { time: "12:00 PM", activity: "Arrive in Hubli", icon: "🏁" }
        ]
      }
    ],
    includes: [
      "3 days, 2 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Temple visits and sightseeing",
      "Boating at Honnavar backwaters",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to monuments",
      "Water sports activities (extra cost)",
      "GST (5%)"
    ]
  },
  {
    id: 2,
    name: "Goa Beach Paradise",
    destination: "Goa",
    days: 4,
    nights: 3,
    price: 12500,
    image: "/assets/packages/goa.png",
    description: "Explore the beaches, nightlife, and heritage of Goa",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "8:00 AM", activity: "Pickup from Mumbai/Bangalore", icon: "🚗" },
          { time: "12:00 PM", activity: "Arrive in Goa, check-in at hotel", icon: "🏨" },
          { time: "1:00 PM", activity: "Welcome lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Visit Old Goa churches", icon: "⛪" },
          { time: "6:00 PM", activity: "Sunset at Calangute Beach", icon: "🌅" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Dudhsagar Waterfalls trek", icon: " thác" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Anjuna Beach and flea market", icon: "🛍️" },
          { time: "6:00 PM", activity: "Water sports at Baga Beach", icon: "🏄" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "10:00 AM", activity: "Cruise on Mandovi River", icon: "🚢" },
          { time: "1:00 PM", activity: "Lunch on cruise", icon: "🍽️" },
          { time: "4:00 PM", activity: "Shopping at Panjim", icon: "🛍️" },
          { time: "7:00 PM", activity: "Casino night (optional)", icon: "🎲" },
          { time: "10:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 4,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Relax at Miramar Beach", icon: "🏖️" },
          { time: "12:00 PM", activity: "Check-out and back to origin", icon: "🚗" }
        ]
      }
    ],
    includes: [
      "4 days, 3 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Sightseeing as per itinerary",
      "Cruise on Mandovi River",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to monuments",
      "Water sports activities (extra cost)",
      "Casino charges",
      "GST (5%)"
    ]
  },
  {
    id: 3,
    name: "Delhi Heritage Tour",
    destination: "Delhi",
    days: 3,
    nights: 2,
    price: 9500,
    image: "/assets/packages/delhi.png",
    description: "Discover the rich history and culture of India's capital",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "8:00 AM", activity: "Pickup from airport/railway station", icon: "🚗" },
          { time: "9:00 AM", activity: "Visit Red Fort", icon: "🏰" },
          { time: "11:00 AM", activity: "Explore Chandni Chowk", icon: "🛍️" },
          { time: "1:00 PM", activity: "Lunch at Paranthe Wali Gali", icon: "🍽️" },
          { time: "3:00 PM", activity: "Visit Jama Masjid", icon: "🕌" },
          { time: "5:00 PM", activity: "Drive through Rajpath", icon: "🚗" },
          { time: "7:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit Qutub Minar", icon: "🕌" },
          { time: "11:00 AM", activity: "Lotus Temple", icon: "🏛️" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "India Gate and Rashtrapati Bhavan", icon: "🏛️" },
          { time: "5:00 PM", activity: "Shopping at Connaught Place", icon: "🛍️" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit Humayun's Tomb", icon: "🏰" },
          { time: "11:00 AM", activity: "Akshardham Temple", icon: "🛕" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Check-out and departure", icon: "🚗" }
        ]
      }
    ],
    includes: [
      "3 days, 2 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Sightseeing as per itinerary",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to monuments",
      "Camera charges",
      "GST (5%)"
    ]
  },
  {
    id: 4,
    name: "Manali Hill Station Escape",
    destination: "Manali, Himachal Pradesh",
    days: 4,
    nights: 3,
    price: 11500,
    image: "/assets/packages/manali.png",
    description: "Experience the beauty of snow-capped mountains and adventure activities",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "7:00 AM", activity: "Pickup from Chandigarh/Delhi", icon: "🚗" },
          { time: "1:00 PM", activity: "Arrive in Manali, check-in at hotel", icon: "🏨" },
          { time: "2:00 PM", activity: "Welcome lunch", icon: "🍽️" },
          { time: "4:00 PM", activity: "Visit Hadimba Temple", icon: "🛕" },
          { time: "6:00 PM", activity: "Mall Road and local market", icon: "🛍️" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Sightseeing tour of Manali", icon: "🏔️" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Adventure activities (paragliding, zorbing)", icon: "🎈" },
          { time: "6:00 PM", activity: "Visit Vashist Hot Springs", icon: "♨️" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "8:00 AM", activity: "Drive to Solang Valley", icon: "🚗" },
          { time: "10:00 AM", activity: "Adventure sports (skiing, snowboarding)", icon: "⛷️" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Rope ways and sightseeing", icon: "🏔️" },
          { time: "6:00 PM", activity: "Back to Manali", icon: "🚗" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 4,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit Rohtang Pass (weather permitting)", icon: "🏔️" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Check-out and departure", icon: "🚗" }
        ]
      }
    ],
    includes: [
      "4 days, 3 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Sightseeing as per itinerary",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to attractions",
      "Adventure sports (extra cost)",
      "Rohtang Pass permit",
      "GST (5%)"
    ]
  },
  {
    id: 5,
    name: "Kerala Backwaters & Beaches",
    destination: "Kerala",
    days: 5,
    nights: 4,
    price: 14500,
    image: "/assets/packages/kerala.png",
    description: "Experience the serene backwaters, beaches, and culture of God's Own Country",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "8:00 AM", activity: "Pickup from Kochi Airport", icon: "🚗" },
          { time: "10:00 AM", activity: "Visit Fort Kochi and Chinese Fishing Nets", icon: "🎣" },
          { time: "12:00 PM", activity: "Lunch at local restaurant", icon: "🍽️" },
          { time: "2:00 PM", activity: "Visit St. Francis Church", icon: "⛪" },
          { time: "4:00 PM", activity: "Drive to Alleppey", icon: "🚗" },
          { time: "7:00 PM", activity: "Check-in at houseboat", icon: "🏠" },
          { time: "8:00 PM", activity: "Dinner and overnight stay on houseboat", icon: "🍽️" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "6:00 AM", activity: "Morning cruise through backwaters", icon: "🚤" },
          { time: "9:00 AM", activity: "Breakfast on houseboat", icon: "🍳" },
          { time: "11:00 AM", activity: "Visit local village and coir factory", icon: "🏭" },
          { time: "1:00 PM", activity: "Lunch on houseboat", icon: "🍽️" },
          { time: "3:00 PM", activity: "Continue backwater cruise", icon: "🚤" },
          { time: "6:00 PM", activity: "Disembark and drive to Kovalam", icon: "🚗" },
          { time: "9:00 PM", activity: "Dinner and overnight stay at beach resort", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Relax at Kovalam Beach", icon: "🏖️" },
          { time: "12:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "2:00 PM", activity: "Ayurvedic massage therapy", icon: "💆" },
          { time: "5:00 PM", activity: "Sunset view at Lighthouse Beach", icon: "🌅" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 4,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Drive to Munnar", icon: "🚗" },
          { time: "2:00 PM", activity: "Arrive in Munnar, check-in at hotel", icon: "🏨" },
          { time: "3:00 PM", activity: "Visit tea plantations", icon: "🌱" },
          { time: "5:00 PM", activity: "Tea tasting at factory", icon: "🍵" },
          { time: "7:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 5,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit Echo Point and Kundala Lake", icon: "🏞️" },
          { time: "12:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "2:00 PM", activity: "Check-out and departure to Kochi", icon: "🚗" },
          { time: "5:00 PM", activity: "Arrive in Kochi for onward journey", icon: "🏁" }
        ]
      }
    ],
    includes: [
      "5 days, 4 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Houseboat stay with all meals",
      "Sightseeing as per itinerary",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to attractions",
      "Ayurvedic treatments (extra cost)",
      "GST (5%)"
    ]
  },
  {
    id: 6,
    name: "Leh Ladakh Adventure",
    destination: "Leh Ladakh, Jammu & Kashmir",
    days: 7,
    nights: 6,
    price: 25000,
    image: "/assets/packages/leh.png",
    description: "Experience the high-altitude desert and Buddhist culture of Ladakh",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "Arrival", activity: "Arrive at Leh Airport, transfer to hotel", icon: "🏨" },
          { time: "Rest", activity: "Rest for acclimatization", icon: "😴" },
          { time: "Evening", activity: "Local market visit", icon: "🛍️" },
          { time: "Night", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "9:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "10:00 AM", activity: "Local sightseeing in Leh", icon: "🏔️" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Visit Shanti Stupa", icon: "🛕" },
          { time: "6:00 PM", activity: "Shopping at Leh Market", icon: "🛍️" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "8:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Drive to Khardung La Pass", icon: "🚗" },
          { time: "1:00 PM", activity: "Lunch at Khardung La", icon: "🍽️" },
          { time: "3:00 PM", activity: "Drive to Nubra Valley", icon: "🚗" },
          { time: "6:00 PM", activity: "Check-in at hotel in Nubra Valley", icon: "🏨" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 4,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit Diskit Monastery", icon: "🛕" },
          { time: "12:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "2:00 PM", activity: "Camel safari in Hunder Sand Dunes", icon: "🐫" },
          { time: "6:00 PM", activity: "Back to hotel", icon: "🏨" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 5,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Drive to Pangong Lake", icon: "🚗" },
          { time: "2:00 PM", activity: "Arrive at Pangong Lake, check-in at camp", icon: "🏕️" },
          { time: "3:00 PM", activity: "Lake sightseeing", icon: "🏞️" },
          { time: "7:00 PM", activity: "Bonfire and dinner", icon: "🔥" },
          { time: "Night", activity: "Overnight stay at camp", icon: "🏕️" }
        ]
      },
      {
        day: 6,
        schedule: [
          { time: "6:00 AM", activity: "Sunrise view at Pangong Lake", icon: "🌅" },
          { time: "8:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "10:00 AM", activity: "Drive back to Leh", icon: "🚗" },
          { time: "4:00 PM", activity: "Arrive in Leh, check-in at hotel", icon: "🏨" },
          { time: "7:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 7,
        schedule: [
          { time: "8:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "10:00 AM", activity: "Visit Thiksey Monastery", icon: "🛕" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Departure to Leh Airport", icon: "🚗" }
        ]
      }
    ],
    includes: [
      "7 days, 6 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Inner Line Permits",
      "Sightseeing as per itinerary",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to monasteries",
      "Camel safari (extra cost)",
      "Oxygen cylinder (if required)",
      "GST (5%)"
    ]
  },
  {
    id: 7,
    name: "Kashmir Valley of Flowers",
    destination: "Kashmir",
    days: 5,
    nights: 4,
    price: 16500,
    image: "/assets/packages/kashmir.png",
    description: "Experience the natural beauty and houseboats of Kashmir",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "Arrival", activity: "Arrive at Srinagar Airport, transfer to hotel", icon: "🏨" },
          { time: "2:00 PM", activity: "Shikara ride on Dal Lake", icon: "🛶" },
          { time: "4:00 PM", activity: "Visit Mughal Gardens", icon: "🌺" },
          { time: "7:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Drive to Pahalgam", icon: "🚗" },
          { time: "1:00 PM", activity: "Lunch en route", icon: "🍽️" },
          { time: "4:00 PM", activity: "Arrive in Pahalgam, check-in at hotel", icon: "🏨" },
          { time: "6:00 PM", activity: "Local market visit", icon: "🛍️" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Sightseeing in Pahalgam", icon: "🏔️" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Visit Betaab Valley", icon: "🏞️" },
          { time: "6:00 PM", activity: "Back to hotel", icon: "🏨" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 4,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Drive back to Srinagar", icon: "🚗" },
          { time: "1:00 PM", activity: "Lunch en route", icon: "🍽️" },
          { time: "4:00 PM", activity: "Check-in at houseboat on Dal Lake", icon: "🏠" },
          { time: "6:00 PM", activity: "Evening at leisure", icon: "🕰️" },
          { time: "8:00 PM", activity: "Dinner on houseboat", icon: "🍽️" },
          { time: "Night", activity: "Overnight stay on houseboat", icon: "🏠" }
        ]
      },
      {
        day: 5,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast on houseboat", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit Shankaracharya Temple", icon: "🛕" },
          { time: "12:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "2:00 PM", activity: "Shopping at Lal Chowk", icon: "🛍️" },
          { time: "4:00 PM", activity: "Departure to Srinagar Airport", icon: "🚗" }
        ]
      }
    ],
    includes: [
      "5 days, 4 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Shikara ride on Dal Lake",
      "Sightseeing as per itinerary",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to attractions",
      "Gondola ride (extra cost)",
      "GST (5%)"
    ]
  },
  {
    id: 8,
    name: "Puducherry French Colony Tour",
    destination: "Puducherry",
    days: 3,
    nights: 2,
    price: 7500,
    image: "/assets/packages/puducherry.png",
    description: "Experience the French colonial charm and spiritual aura of Puducherry",
    itinerary: [
      {
        day: 1,
        schedule: [
          { time: "8:00 AM", activity: "Pickup from Chennai", icon: "🚗" },
          { time: "11:00 AM", activity: "Arrive in Puducherry, check-in at hotel", icon: "🏨" },
          { time: "12:00 PM", activity: "Welcome lunch", icon: "🍽️" },
          { time: "2:00 PM", activity: "Visit Sri Aurobindo Ashram", icon: "🛕" },
          { time: "4:00 PM", activity: "Explore French Quarter", icon: "🏛️" },
          { time: "6:00 PM", activity: "Visit Promenade Beach", icon: "🏖️" },
          { time: "8:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 2,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit Auroville - The City of Dawn", icon: "🌞" },
          { time: "1:00 PM", activity: "Lunch at Auroville", icon: "🍽️" },
          { time: "3:00 PM", activity: "Visit Matrimandir", icon: "🏛️" },
          { time: "5:00 PM", activity: "Back to Puducherry", icon: "🚗" },
          { time: "7:00 PM", activity: "Dinner and overnight stay", icon: "🏨" }
        ]
      },
      {
        day: 3,
        schedule: [
          { time: "7:00 AM", activity: "Breakfast", icon: "🍳" },
          { time: "9:00 AM", activity: "Visit White Town and Heritage buildings", icon: "🏛️" },
          { time: "11:00 AM", activity: "Shopping at Jubilee Market", icon: "🛍️" },
          { time: "1:00 PM", activity: "Lunch", icon: "🍽️" },
          { time: "3:00 PM", activity: "Visit Paradise Beach", icon: "🏖️" },
          { time: "5:00 PM", activity: "Check-out and departure to Chennai", icon: "🚗" }
        ]
      }
    ],
    includes: [
      "3 days, 2 nights accommodation",
      "All meals as per itinerary",
      "Transportation in AC vehicle",
      "Sightseeing as per itinerary",
      "Driver allowance and fuel"
    ],
    excludes: [
      "Personal expenses",
      "Entry fees to attractions",
      "Camera charges",
      "GST (5%)"
    ]
  }
];

export default function FixedVacationPackages() {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    passengers: 1,
    vehicleType: 'economy'
  });

  const handleBookPackage = (pkg) => {
    setSelectedPackage(pkg);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    try {
      // Calculate end date based on package duration
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedPackage.days);

      // Prepare vacation data
      const vacationData = {
        destination: selectedPackage.destination,
        hotel_name: "Package Accommodation",
        hotel_address: selectedPackage.destination,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        passengers: bookingData.passengers,
        vehicle_type: bookingData.vehicleType,
        ride_included: true,
        hotel_included: true,
        is_fixed_package: true,
        total_price: selectedPackage.price,
        status: "pending",
        // Add package details to schedule
        schedule: JSON.stringify({
          packageName: selectedPackage.name,
          itinerary: selectedPackage.itinerary,
          includes: selectedPackage.includes,
          excludes: selectedPackage.excludes
        })
      };

      const response = await vacationService.createVacation(vacationData);
      alert('Vacation package booked successfully!');
      setShowBookingForm(false);
      setBookingData({
        startDate: '',
        endDate: '',
        passengers: 1,
        vehicleType: 'economy'
      });
    } catch (error) {
      console.error('Failed to book vacation package:', error);
      alert('Failed to book vacation package. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Fixed Vacation Packages</h1>
        <p className="text-center text-gray-400 mb-12">Choose from our curated vacation packages for a hassle-free travel experience</p>

        {!showBookingForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FIXED_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="card hover:shadow-xl transition-shadow duration-300 bg-dark-800 border border-dark-700">
                <div className="relative group h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={pkg.image}
                    alt={pkg.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 bg-dark-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm z-20 text-white border border-dark-700">
                    ₹{pkg.price}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-white">{pkg.name}</h3>
                  <div className="flex items-center text-gray-400 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{pkg.destination}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{pkg.days}D/{pkg.nights}N</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      <span>4.8</span>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4 line-clamp-2">{pkg.description}</p>

                  <button
                    onClick={() => handleBookPackage(pkg)}
                    className="w-full btn-primary"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto card">
            <h2 className="text-2xl font-bold mb-6 text-white">Book {selectedPackage?.name}</h2>

            <div className="mb-6">
              <img
                src={selectedPackage?.image}
                alt={selectedPackage?.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">{selectedPackage?.name}</h3>
                <span className="text-2xl font-bold text-primary-400">₹{selectedPackage?.price}</span>
              </div>
              <p className="text-gray-400">{selectedPackage?.destination} • {selectedPackage?.days}D/{selectedPackage?.nights}N</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={bookingData.startDate}
                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Passengers</label>
                  <select
                    value={bookingData.passengers}
                    onChange={(e) => setBookingData({ ...bookingData, passengers: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Type</label>
                  <select
                    value={bookingData.vehicleType}
                    onChange={(e) => setBookingData({ ...bookingData, vehicleType: e.target.value })}
                    className="input-field"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium">Premium</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 btn-outline text-white border-white hover:bg-white hover:text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedPackage && showBookingForm && (
          <div className="mt-8 card">
            <h3 className="text-xl font-bold mb-4 text-white">Package Itinerary</h3>

            <div className="space-y-6">
              {selectedPackage.itinerary.map((day, index) => (
                <div key={index} className="border-l-4 border-primary-900 pl-4">
                  <h4 className="text-lg font-bold mb-3 text-white">Day {day.day}</h4>
                  <div className="space-y-3">
                    {day.schedule.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center mr-3">
                          <span className="text-primary-400 font-bold">{item.time}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-300">{item.activity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-bold mb-3 text-white">Includes</h4>
                <ul className="space-y-2">
                  {selectedPackage.includes.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-3 text-white">Excludes</h4>
                <ul className="space-y-2">
                  {selectedPackage.excludes.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}