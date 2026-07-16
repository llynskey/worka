"""Static demo-data pools for the Fixa seed generator (schema-independent).

Cities carry real centre coordinates so seeded jobs populate the map. Message
snippets deliberately include phone numbers / emails / addresses / links so the
pre-booking contact-redaction can be seen working. All content is fictional.
"""

# (city, country, latitude, longitude)
UK_CITIES = [
    ("London", "GB", 51.5074, -0.1278),
    ("Manchester", "GB", 53.4808, -2.2426),
    ("Birmingham", "GB", 52.4862, -1.8904),
    ("Leeds", "GB", 53.8008, -1.5491),
    ("Glasgow", "GB", 55.8642, -4.2518),
    ("Edinburgh", "GB", 55.9533, -3.1883),
    ("Bristol", "GB", 51.4545, -2.5879),
    ("Liverpool", "GB", 53.4084, -2.9916),
    ("Sheffield", "GB", 53.3811, -1.4701),
    ("Newcastle", "GB", 54.9783, -1.6178),
    ("Nottingham", "GB", 52.9548, -1.1581),
    ("Cardiff", "GB", 51.4816, -3.1791),
    ("Brighton", "GB", 50.8225, -0.1372),
    ("Cambridge", "GB", 52.2053, 0.1218),
    ("Oxford", "GB", 51.7520, -1.2577),
    ("Leicester", "GB", 52.6369, -1.1398),
    ("Southampton", "GB", 50.9097, -1.4044),
    ("Reading", "GB", 51.4543, -0.9781),
    ("Coventry", "GB", 52.4068, -1.5197),
    ("Belfast", "GB", 54.5973, -5.9301),
]

FR_CITIES = [
    ("Paris", "FR", 48.8566, 2.3522),
    ("Lyon", "FR", 45.7640, 4.8357),
    ("Marseille", "FR", 43.2965, 5.3698),
    ("Toulouse", "FR", 43.6047, 1.4442),
    ("Nice", "FR", 43.7102, 7.2620),
    ("Nantes", "FR", 47.2184, -1.5536),
    ("Bordeaux", "FR", 44.8378, -0.5792),
    ("Lille", "FR", 50.6292, 3.0573),
    ("Strasbourg", "FR", 48.5734, 7.7521),
    ("Montpellier", "FR", 43.6108, 3.8767),
    ("Rennes", "FR", 48.1173, -1.6778),
    ("Grenoble", "FR", 45.1885, 5.7245),
    ("Rouen", "FR", 49.4432, 1.0993),
    ("Toulon", "FR", 43.1242, 5.9280),
    ("Reims", "FR", 49.2583, 4.0317),
]

CITIES = UK_CITIES + FR_CITIES

UK_FIRST = ["Oliver", "Amelia", "Harry", "Isla", "Jack", "Ava", "George", "Mia",
            "Noah", "Grace", "Leo", "Sophie", "Arthur", "Freya", "Oscar", "Poppy",
            "Charlie", "Ella", "Henry", "Lily", "Jacob", "Evie", "Thomas", "Ruby"]
UK_LAST = ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Evans",
           "Thomas", "Roberts", "Walker", "Wright", "Robinson", "Thompson",
           "Wood", "Hall", "Green", "Clarke", "Hughes", "Ward", "Turner"]

FR_FIRST = ["Louis", "Emma", "Gabriel", "Jade", "Raphael", "Louise", "Arthur",
            "Alice", "Hugo", "Chloe", "Jules", "Lina", "Adam", "Mila", "Lucas",
            "Manon", "Nathan", "Camille", "Theo", "Sarah", "Paul", "Julie"]
FR_LAST = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit",
           "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel",
           "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier"]

# Category -> (specialty label, [ (title, description) job templates ])
CATEGORY_JOBS = {
    "plumbing": ("Plumber", [
        ("Leaking kitchen tap", "The mixer tap under the kitchen drips constantly and needs replacing or resealing."),
        ("Blocked bathroom drain", "Shower drains very slowly and water backs up. Needs clearing."),
        ("Install new radiator", "Want a new radiator fitted in the back bedroom, pipework already close by."),
        ("Boiler losing pressure", "Combi boiler keeps dropping pressure every few days, needs looking at."),
        ("Replace bathroom toilet", "Old toilet cracked at the base, need it removed and a new one fitted."),
    ]),
    "electrical": ("Electrician", [
        ("Fit extra sockets in office", "Need two double sockets added to a home office, walls are plasterboard."),
        ("Replace consumer unit", "Old fuse box needs upgrading to a modern consumer unit with RCDs."),
        ("Outdoor lighting install", "Want two security lights fitted at the front and back of the house."),
        ("Faulty light circuit", "Upstairs lights trip the breaker intermittently. Needs diagnosing."),
        ("EV charger installation", "Looking to have a home EV charger fitted on the driveway wall."),
    ]),
    "painting": ("Painter & Decorator", [
        ("Repaint living room", "Living room walls and ceiling need repainting, roughly 4m x 5m."),
        ("Paint exterior front door", "Front door and frame need sanding and repainting in a dark blue."),
        ("Wallpaper hallway", "Hall, stairs and landing to be stripped and re-wallpapered."),
        ("Paint two bedrooms", "Two bedrooms need a fresh coat, walls only, neutral colours."),
        ("Kitchen cabinet respray", "Would like the kitchen units resprayed rather than replaced."),
    ]),
    "cleaning": ("Cleaner", [
        ("End of tenancy clean", "Two-bed flat needs a full end-of-tenancy deep clean before handover."),
        ("Weekly house clean", "Looking for a regular weekly clean of a three-bed house."),
        ("Oven deep clean", "Oven and hob need a proper deep clean, lots of built-up grease."),
        ("After-builders clean", "Extension just finished, whole ground floor needs a builders clean."),
        ("Carpet cleaning", "Living room and stairs carpets need a professional shampoo."),
    ]),
    "garden": ("Gardener", [
        ("Overgrown garden tidy-up", "Back garden is very overgrown, needs cutting back and clearing."),
        ("Lawn mowing service", "Front and back lawns need regular fortnightly mowing over summer."),
        ("Hedge trimming", "Long boundary hedge needs trimming down and shaping."),
        ("Build raised beds", "Would like two timber raised vegetable beds built and filled."),
        ("Fence panel replacement", "Three fence panels blew down and need replacing."),
    ]),
    "repairs": ("Handyman", [
        ("Flat-pack furniture assembly", "A wardrobe and chest of drawers need assembling."),
        ("Hang shelves and pictures", "Several shelves and framed pictures to be put up securely."),
        ("Fix sticking door", "Bedroom door sticks and won't close properly, needs easing."),
        ("Mount TV on wall", "55-inch TV to be wall-mounted with cables tidied away."),
        ("Repair garden gate", "Side gate is dropping and the latch no longer catches."),
    ]),
}

CATEGORIES = list(CATEGORY_JOBS.keys())

# Pre-booking chat lines. Some intentionally contain contact details / addresses
# / links so redaction can be verified in the seeded conversations.
CUSTOMER_MESSAGES = [
    "Hi, when would you be free to come and take a look?",
    "Thanks for the quote — does that include materials?",
    "The address is 12 Baker Street if you want to swing by.",
    "You can reach me directly on 07911 123456.",
    "Email me at contact@example.com and I'll send photos.",
    "We're just off the high street, postcode SW1A 1AA.",
    "Is the price negotiable at all?",
    "Great, that works for me. What days are you around?",
    "Here are some photos: www.myphotos.example.com",
    "Whatsapp me on 07700 900123 if that's easier.",
]

PRO_MESSAGES = [
    "Hi, happy to help — I could come by this week to assess it.",
    "Yes, the quote includes all materials and labour.",
    "I'll send over a firm price once I've seen it in person.",
    "I have availability Thursday or Friday morning, does that suit?",
    "No problem, I can work around your schedule.",
    "That's my best price given the materials involved.",
    "I'll bring everything needed on the day.",
    "Thanks for considering me for the job!",
]

REVIEW_TEXTS = [
    ("Excellent work, turned up on time and left everything spotless.", 5),
    ("Really pleased with the result, would definitely use again.", 5),
    ("Good job overall, a little late but the work was solid.", 4),
    ("Professional and friendly, fair price for the quality.", 5),
    ("Did exactly what was asked, no fuss.", 4),
    ("Fantastic — went above and beyond what I expected.", 5),
    ("Happy with the finish, communication could have been better.", 4),
    ("Sorted a tricky problem quickly. Highly recommended.", 5),
]

PRO_BIOS = [
    "Time-served tradesperson with over ten years' experience across residential jobs.",
    "Friendly, reliable and tidy — I treat every home like my own.",
    "Fully insured and happy to quote on jobs big and small.",
    "Local specialist focused on quality work and fair pricing.",
    "Multilingual pro comfortable working with expat clients.",
]
