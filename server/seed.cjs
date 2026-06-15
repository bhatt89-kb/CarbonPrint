function seedDB(db) {
  // Check if data already exists
  const count = db.prepare('SELECT COUNT(*) as cnt FROM eco_actions').get();
  if (count.cnt > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // ── Seed Eco Actions (24 total, 6 per category) ──────────────────────
  const insertAction = db.prepare(`
    INSERT INTO eco_actions (title, description, category, co2_reduction_kg, cost_savings, difficulty, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const actions = [
    // Transport (6)
    ['Use public transportation', 'Replace car trips with buses, trains, or trams to significantly cut your carbon emissions from daily commuting.', 'transport', 8, 50, 'easy', 'bus'],
    ['Carpool to work', 'Share rides with coworkers or neighbors to split fuel costs and reduce the number of vehicles on the road.', 'transport', 12, 80, 'easy', 'users'],
    ['Switch to electric vehicle', 'Transition from a gas-powered car to an electric vehicle for dramatically lower lifetime emissions.', 'transport', 80, -200, 'hard', 'zap'],
    ['Bike to work', 'Use a bicycle for your daily commute to eliminate tailpipe emissions while improving your fitness.', 'transport', 15, 60, 'medium', 'bike'],
    ['Work from home', 'Telecommute when possible to eliminate commuting emissions entirely and save on fuel costs.', 'transport', 20, 100, 'easy', 'home'],
    ['Combine errands', 'Plan your trips efficiently by grouping multiple errands into one outing to reduce total driving distance.', 'transport', 5, 20, 'easy', 'map'],

    // Energy (6)
    ['Switch to LED lighting', 'Replace incandescent and CFL bulbs with energy-efficient LEDs that last longer and use far less electricity.', 'energy', 5, 15, 'easy', 'lightbulb'],
    ['Install smart thermostat', 'Use a programmable smart thermostat to optimize heating and cooling schedules based on your routine.', 'energy', 15, 30, 'medium', 'thermometer'],
    ['Air dry laundry', 'Skip the dryer and hang your clothes to dry naturally, saving energy and extending fabric life.', 'energy', 8, 10, 'easy', 'wind'],
    ['Unplug unused devices', 'Eliminate phantom power draw by unplugging electronics and chargers when they are not actively in use.', 'energy', 3, 8, 'easy', 'plug'],
    ['Switch to renewable energy', 'Choose a green energy provider or install solar panels to power your home with clean electricity.', 'energy', 50, 0, 'medium', 'sun'],
    ['Improve home insulation', 'Upgrade your home insulation to reduce heating and cooling energy loss through walls, roof, and windows.', 'energy', 25, -50, 'hard', 'shield'],

    // Food (6)
    ['Eat plant-based meals 3x/week', 'Replace meat with plant-based proteins three times per week to lower your dietary carbon footprint.', 'food', 20, 30, 'medium', 'salad'],
    ['Buy local produce', 'Purchase fruits and vegetables from local farms and markets to reduce transportation emissions in the food supply chain.', 'food', 8, 0, 'easy', 'map-pin'],
    ['Reduce food waste', 'Plan meals carefully, store food properly, and use leftovers creatively to minimize the amount of food you throw away.', 'food', 10, 40, 'easy', 'trash-2'],
    ['Start composting', 'Compost your organic kitchen and garden waste instead of sending it to landfill where it produces methane.', 'food', 5, 0, 'medium', 'flower'],
    ['Grow your own herbs', 'Cultivate fresh herbs at home to reduce packaging waste and the carbon footprint of store-bought herbs.', 'food', 2, 10, 'easy', 'sprout'],
    ['Choose seasonal produce', 'Buy fruits and vegetables that are in season locally to avoid energy-intensive greenhouse growing or long-distance imports.', 'food', 6, 5, 'easy', 'calendar'],

    // Waste (6)
    ['Use reusable bags', 'Bring your own bags when shopping to eliminate the need for single-use plastic or paper bags.', 'waste', 2, 5, 'easy', 'shopping-bag'],
    ['Use reusable water bottle', 'Carry a refillable water bottle instead of buying disposable plastic bottles throughout the day.', 'waste', 3, 15, 'easy', 'droplet'],
    ['Recycle properly', 'Learn your local recycling guidelines and sort your waste correctly to maximize material recovery rates.', 'waste', 8, 0, 'easy', 'recycle'],
    ['Buy second-hand items', 'Purchase pre-owned clothing, furniture, and electronics to extend product lifecycles and reduce manufacturing demand.', 'waste', 15, 100, 'easy', 'refresh-cw'],
    ['Go paperless', 'Switch to digital bills, statements, and notes to reduce paper consumption and associated deforestation.', 'waste', 4, 5, 'easy', 'file-text'],
    ['Refuse single-use plastics', 'Decline straws, utensils, and containers made of disposable plastic and carry your own reusable alternatives.', 'waste', 5, 10, 'medium', 'x-circle'],
  ];

  const insertActions = db.transaction(() => {
    for (const a of actions) {
      insertAction.run(...a);
    }
  });
  insertActions();

  // ── Seed Badges (12) ─────────────────────────────────────────────────
  const insertBadge = db.prepare(`
    INSERT INTO badges (name, description, icon, criteria, points_required)
    VALUES (?, ?, ?, ?, ?)
  `);

  const badges = [
    ['First Steps', 'Complete your first footprint calculation', 'footprints', 'first_calculation', 0],
    ['Green Warrior', 'Adopt 5 eco-actions', 'shield', 'adopt_5_actions', 100],
    ['Eco Champion', 'Adopt 10 eco-actions', 'trophy', 'adopt_10_actions', 250],
    ['Carbon Cutter', 'Reduce your footprint by 10%', 'scissors', 'reduce_10_pct', 200],
    ['Half Way There', 'Reduce your footprint by 50%', 'trending-down', 'reduce_50_pct', 500],
    ['Goal Getter', 'Complete your first monthly goal', 'target', 'first_goal_met', 150],
    ['Streak Master', '3 consecutive months meeting goals', 'flame', 'streak_3_months', 300],
    ['Knowledge Seeker', 'Read 5 articles', 'book-open', 'read_5_articles', 100],
    ['Challenge Accepted', 'Complete 5 challenges', 'check-circle', 'complete_5_challenges', 200],
    ['Community Leader', 'Reach top 10 on the leaderboard', 'award', 'top_10_leaderboard', 400],
    ['Planet Hero', 'Earn 1000 total points', 'globe', 'total_1000_points', 1000],
    ['Zero Waste Champion', 'Adopt all waste-related actions', 'package', 'all_waste_actions', 350],
  ];

  const insertBadges = db.transaction(() => {
    for (const b of badges) {
      insertBadge.run(...b);
    }
  });
  insertBadges();

  // ── Seed Articles (16, 4 per category) ────────────────────────────────
  const insertArticle = db.prepare(`
    INSERT INTO articles (title, summary, content, category, reading_time, thumbnail)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const articles = [
    // Climate Change (4)
    [
      'Understanding the Greenhouse Effect',
      'Learn how greenhouse gases trap heat in Earth\'s atmosphere. This fundamental concept is key to understanding why our planet is warming.',
      `The greenhouse effect is a natural process that warms the Earth's surface. When the Sun's energy reaches the Earth, some of it is reflected back to space and the rest is absorbed, warming the planet. The Earth then radiates heat energy back toward space. Greenhouse gases in the atmosphere, including carbon dioxide, methane, and water vapor, absorb and re-emit this heat, trapping it and warming the lower atmosphere.

Without the natural greenhouse effect, Earth's average temperature would be about -18°C (0°F), far too cold for most life as we know it. However, human activities—particularly burning fossil fuels, deforestation, and industrial agriculture—have dramatically increased the concentration of these gases. Since the Industrial Revolution, atmospheric CO2 has risen from about 280 parts per million to over 420 ppm today.

This enhanced greenhouse effect is the primary driver of climate change. The extra trapped heat is raising global average temperatures, melting ice caps, raising sea levels, and intensifying extreme weather events. Scientists from the IPCC have confirmed that human influence has warmed the planet by approximately 1.1°C above pre-industrial levels.

Understanding this mechanism is the first step toward meaningful action. By reducing our greenhouse gas emissions through cleaner energy, efficient transportation, and sustainable practices, we can slow the rate of warming and limit the most severe impacts of climate change.`,
      'climate_change', 5, null
    ],
    [
      'The Impact of Rising Sea Levels',
      'Rising seas threaten coastal communities worldwide. Explore the causes, current trends, and what we can expect in coming decades.',
      `Sea levels have risen by approximately 20 centimeters since the beginning of the 20th century, and the rate of rise is accelerating. Two primary factors drive this phenomenon: thermal expansion, where warming ocean water expands in volume, and the melting of land-based ice from glaciers and the Greenland and Antarctic ice sheets. Both are direct consequences of global warming caused by human greenhouse gas emissions.

The impacts of rising sea levels are already being felt. Low-lying island nations in the Pacific, such as Tuvalu and the Marshall Islands, face existential threats. Major coastal cities like Miami, Jakarta, Shanghai, and Mumbai experience more frequent flooding during high tides and storms. Saltwater intrusion into freshwater aquifers threatens drinking water supplies and agricultural productivity in coastal regions.

Current projections suggest that sea levels could rise between 0.3 and 1.0 meters by 2100, depending on our emissions trajectory. Under worst-case scenarios, where ice sheet dynamics accelerate, the rise could exceed 2 meters. Even modest increases would displace hundreds of millions of people and cause trillions of dollars in damage to infrastructure.

Adaptation strategies include building sea walls and flood barriers, restoring mangrove forests and wetlands that act as natural buffers, and managed retreat from the most vulnerable areas. However, the most effective long-term strategy remains reducing greenhouse gas emissions to limit warming and slow the rate of ice melt and thermal expansion.`,
      'climate_change', 6, null
    ],
    [
      'Carbon Footprint Basics: What You Need to Know',
      'Your carbon footprint measures the total greenhouse gases you produce. Understanding it is the first step to reducing your environmental impact.',
      `A carbon footprint is the total amount of greenhouse gases generated by our actions, expressed as carbon dioxide equivalents (CO2e). It encompasses everything from the energy we use at home, the transportation we rely on, the food we eat, and the products we buy. The average person in the United States produces about 16 tons of CO2e per year, while the global average is closer to 4 tons.

Your carbon footprint can be broken into several key categories. Transportation typically accounts for the largest share in developed countries, especially if you drive frequently or fly often. A single round-trip transatlantic flight can generate about 1.6 tons of CO2e per passenger. Home energy use—heating, cooling, and electricity—is another major contributor, particularly in regions that rely heavily on coal or natural gas for power generation.

Food choices also play a significant role. Producing one kilogram of beef generates roughly 27 kg of CO2e, compared to just 0.9 kg for one kilogram of lentils. A meat-heavy diet can have double the carbon footprint of a plant-based one. Waste management, consumer goods, and services round out the remaining contributions, with fast fashion, electronics, and excessive packaging all adding to your total impact.

Calculating your footprint is the essential first step toward reduction. Tools like EcoTrack help you measure and track your emissions across these categories, identify the biggest areas for improvement, and set realistic goals. Even small changes—like switching to LED lighting, eating less meat, or cycling instead of driving—can collectively make a significant difference.`,
      'climate_change', 5, null
    ],
    [
      'Climate Tipping Points: A Looming Threat',
      'Scientists warn of critical thresholds in the climate system. Crossing these tipping points could trigger irreversible and cascading changes.',
      `Climate tipping points are critical thresholds where small additional changes can trigger large, often irreversible shifts in Earth's climate system. Scientists have identified at least 16 major tipping elements, including the collapse of the Greenland and West Antarctic ice sheets, the die-off of the Amazon rainforest, the thawing of Arctic permafrost, and disruption of the Atlantic Meridional Overturning Circulation (AMOC), which includes the Gulf Stream.

Research published in recent years suggests that some of these tipping points may be closer than previously thought. At 1.5°C of warming, we risk triggering the loss of tropical coral reefs and the collapse of the Greenland ice sheet over centuries. At 2°C, permafrost thaw could release massive amounts of stored methane and CO2, creating a feedback loop that accelerates warming beyond human control. The Amazon rainforest, already stressed by deforestation and drought, could transition from a carbon sink to a carbon source.

The danger of tipping points lies in their interconnected nature. One tipping point can cascade into others, creating a domino effect. For example, Arctic ice loss reduces the Earth's reflectivity, accelerating warming, which in turn speeds permafrost thaw, releasing more greenhouse gases, further amplifying the warming. This cascading phenomenon could push the planet into a "hothouse Earth" state that would be catastrophic for human civilization.

Avoiding these tipping points requires rapid and deep reductions in greenhouse gas emissions. The Paris Agreement goal of limiting warming to 1.5°C was specifically designed with tipping points in mind. Every fraction of a degree matters, and individual actions, when multiplied across billions of people, contribute meaningfully to staying below these dangerous thresholds.`,
      'climate_change', 8, null
    ],

    // Sustainable Living (4)
    [
      'Getting Started with Sustainable Living',
      'Sustainable living doesn\'t have to be overwhelming. Start with these practical everyday changes that make a real difference.',
      `Sustainable living is about making choices that reduce your environmental impact while maintaining a comfortable quality of life. It's not about perfection or drastic sacrifices—it's about conscious decisions that add up over time. The key is to start where you are and make incremental changes that feel manageable and sustainable in themselves.

Begin with the areas of highest impact. Your home energy use and transportation choices typically account for the majority of your personal carbon footprint. Simple switches like replacing incandescent bulbs with LEDs, adjusting your thermostat by just 2 degrees, and properly insulating your home can reduce energy consumption by 20-30%. For transportation, combining errands, carpooling, or cycling for short trips can dramatically cut your emissions.

Your consumption habits are another powerful lever. The fashion industry alone accounts for about 10% of global carbon emissions—more than international flights and maritime shipping combined. Buying fewer, higher-quality items, choosing second-hand, and maintaining what you own extends product lifespans and reduces demand for new manufacturing. The same principle applies to electronics, furniture, and household goods.

Finally, engage with your community and use your voice. Talk to friends and family about sustainable choices, support businesses with strong environmental practices, and advocate for climate-friendly policies at the local and national level. Collective action amplifies individual impact, and cultural shifts toward sustainability create the conditions for systemic change. Remember that progress, not perfection, is the goal.`,
      'sustainable_living', 5, null
    ],
    [
      'The Power of Plant-Based Eating',
      'Shifting toward plant-based meals is one of the most impactful changes you can make. Discover the environmental benefits of eating more plants.',
      `The food system is responsible for approximately 26% of global greenhouse gas emissions, and animal agriculture is the largest contributor within that sector. Livestock farming generates methane from digestion, nitrous oxide from manure, and CO2 from feed production, land clearing, and transportation. Shifting toward a more plant-based diet is consistently identified by scientists as one of the most effective individual actions for reducing environmental impact.

The numbers are striking. Producing a kilogram of beef requires about 15,000 liters of water and generates 27 kg of CO2e, while a kilogram of tofu requires about 2,000 liters and generates just 2 kg of CO2e. If the global population shifted to a plant-based diet, we could reduce food-related emissions by up to 70%, free up 76% of agricultural land currently used for livestock, and significantly reduce water pollution from agricultural runoff.

You don't need to go fully vegan to make a difference. Research shows that simply reducing meat consumption—particularly beef and lamb—and replacing it with plant proteins like beans, lentils, nuts, and tofu can cut your dietary carbon footprint by 50% or more. Strategies like "Meatless Mondays," choosing plant-based options when dining out, and exploring international cuisines that are naturally plant-heavy make the transition enjoyable and sustainable.

Beyond environmental benefits, plant-based eating is associated with lower rates of heart disease, type 2 diabetes, and certain cancers. It can also save money, as beans, grains, and seasonal vegetables are typically less expensive than meat. The key is variety and balance—ensuring you get adequate protein, iron, B12, and omega-3 fatty acids through diverse whole foods or appropriate supplementation.`,
      'sustainable_living', 6, null
    ],
    [
      'Minimalism and Sustainability',
      'Owning less means consuming less and wasting less. Learn how minimalism and sustainability go hand in hand for a lighter footprint.',
      `Minimalism and sustainability are natural allies. At its core, minimalism is about intentional living—owning only what adds genuine value to your life and letting go of the rest. This philosophy directly supports sustainability by reducing consumption, waste generation, and the demand for new products and their associated environmental costs.

The average American home contains over 300,000 items, and studies show that we regularly use only about 20% of what we own. This overconsumption drives a massive industrial machine: raw material extraction, manufacturing, global shipping, and eventually, disposal in landfills. The fashion industry alone produces 92 million tons of textile waste annually. By buying less and choosing more thoughtfully, minimalists naturally shrink their environmental footprint.

Adopting minimalist habits doesn't mean living with empty rooms or wearing the same outfit every day. It means asking "Do I really need this?" before making a purchase, choosing quality over quantity, maintaining and repairing items instead of replacing them, and finding joy in experiences rather than possessions. Digital minimalism—reducing unnecessary subscriptions, storage, and screen time—also has environmental benefits, as data centers consume enormous amounts of energy.

The financial benefits of minimalism often surprise people. Spending less on unnecessary items frees up resources for higher-quality sustainable products, experiences with loved ones, and investments in your future. Many minimalists report reduced stress and greater life satisfaction, finding that the pursuit of "enough" is more fulfilling than the pursuit of "more." Start small: declutter one area of your home this week and notice how it feels.`,
      'sustainable_living', 5, null
    ],
    [
      'Eco-Friendly Home Improvements',
      'Transform your home into an eco-friendly haven. From insulation to smart devices, these upgrades pay for themselves and help the planet.',
      `Making your home more energy-efficient is one of the best investments you can make for both your wallet and the environment. Buildings account for roughly 40% of energy consumption and 33% of greenhouse gas emissions globally. Fortunately, many improvements are straightforward, increasingly affordable, and can reduce your energy bills by 30-50%.

Start with the building envelope—the physical barrier between interior and exterior. Adding or upgrading insulation in attics, walls, and basements can reduce heating and cooling costs by up to 40%. Sealing air leaks around windows, doors, and ductwork prevents conditioned air from escaping. Double or triple-glazed windows with low-emissivity coatings dramatically reduce heat transfer. These improvements provide year-round benefits and typically pay for themselves within 3-7 years.

Smart technology offers another layer of efficiency. Smart thermostats learn your schedule and optimize heating and cooling, saving an average of 10-15% on energy bills. Smart power strips eliminate phantom loads from electronics in standby mode. LED lighting uses 75% less energy than incandescent bulbs and lasts 25 times longer. Energy monitoring systems help you identify which appliances and habits consume the most electricity, enabling targeted improvements.

When it's time to replace major systems, consider heat pumps for heating and cooling, which are 3-5 times more efficient than traditional furnaces. Solar panels have become increasingly affordable, with many homeowners seeing positive returns within 6-10 years. Even simple changes like low-flow showerheads, efficient washing machines, and proper refrigerator maintenance contribute to a more sustainable home. Every improvement compounds over time, reducing both your carbon footprint and your utility expenses.`,
      'sustainable_living', 7, null
    ],

    // Renewable Energy (4)
    [
      'Solar Energy: A Bright Future',
      'Solar power has become the cheapest electricity source in history. Learn how solar works and why it\'s transforming the global energy landscape.',
      `Solar energy has undergone a remarkable transformation over the past decade. The cost of solar photovoltaic (PV) panels has dropped by over 90% since 2010, making solar the cheapest source of new electricity generation in most parts of the world. In 2023 alone, global solar capacity grew by over 300 gigawatts—more than the total electricity generation capacity of France and Germany combined.

Solar panels work by converting sunlight directly into electricity through the photovoltaic effect. When photons from sunlight strike semiconductor materials in the solar cells (typically silicon), they knock electrons free, creating an electrical current. Modern residential panels typically convert 18-22% of incoming sunlight into electricity, with cutting-edge laboratory cells exceeding 47% efficiency. Panels are rated by their peak output in watts and typically produce power proportional to the amount of sunlight they receive.

For homeowners, rooftop solar offers compelling economics. A typical residential installation (6-10 kW) can generate 70-100% of a household's electricity needs, saving thousands of dollars over the 25-30 year lifespan of the panels. Many regions offer net metering, where excess energy is sold back to the grid, and various tax credits and incentives further improve the return on investment. Battery storage systems like Tesla Powerwall allow homeowners to store excess solar energy for use during evenings or power outages.

At the utility scale, solar farms are transforming energy markets worldwide. Countries like China, India, and the United States are leading massive solar deployments. Combined with advancing battery storage technology, solar energy is increasingly able to provide reliable baseload power. The International Energy Agency projects that solar could become the world's largest source of electricity by 2035, playing a central role in the transition to a zero-carbon energy system.`,
      'renewable_energy', 6, null
    ],
    [
      'Wind Power: Harnessing Nature\'s Force',
      'Wind energy is one of the fastest-growing power sources globally. Discover how modern wind turbines work and their role in clean energy.',
      `Wind power has emerged as a cornerstone of the clean energy transition. Global wind capacity has grown from just 17 gigawatts in 2000 to over 900 gigawatts today, supplying approximately 7% of the world's electricity. Modern wind farms can produce electricity at costs competitive with or below fossil fuels, making wind one of the most economically attractive new power sources available.

Modern wind turbines are engineering marvels. The largest offshore turbines now stand over 260 meters tall—taller than many skyscrapers—with blade spans exceeding 220 meters. These massive machines can generate 15 megawatts or more, enough to power over 20,000 homes each. The turbines work by converting kinetic energy from moving air into rotational energy via the blades, which drive a generator to produce electricity. Advanced control systems continuously adjust blade pitch and turbine orientation to maximize energy capture.

Offshore wind is experiencing particularly rapid growth. Locating turbines at sea takes advantage of stronger, more consistent winds while avoiding land-use conflicts. Countries like the United Kingdom, Denmark, and China have built massive offshore wind farms, and the United States is rapidly developing its own offshore wind industry along the Atlantic coast. Floating offshore wind technology is opening up deep-water locations previously inaccessible with fixed-bottom foundations.

Wind energy does face challenges, including intermittency (wind doesn't blow all the time), wildlife impacts on birds and bats, and visual concerns in scenic areas. However, these challenges are being addressed through improved forecasting, grid-scale battery storage, wildlife-friendly turbine designs, and thoughtful siting practices. Combined with solar and storage, wind power is essential to achieving net-zero emissions and ensuring a sustainable energy future for generations to come.`,
      'renewable_energy', 7, null
    ],
    [
      'The Rise of Battery Storage Technology',
      'Energy storage is solving renewable energy\'s biggest challenge: intermittency. See how batteries are enabling a fully clean grid.',
      `The biggest challenge facing renewable energy has always been intermittency—the sun doesn't always shine, and the wind doesn't always blow. Battery storage technology is rapidly solving this problem, enabling clean energy to provide reliable, round-the-clock power. The global energy storage market is growing at over 30% annually, driven by falling costs, improving technology, and supportive policies.

Lithium-ion batteries currently dominate the energy storage market, benefiting from massive manufacturing scale driven by the electric vehicle industry. Battery pack costs have fallen by over 90% since 2010, from over $1,100 per kilowatt-hour to around $140 per kWh. At the utility scale, large battery installations can store gigawatt-hours of energy, smoothing out renewable energy fluctuations and providing grid stability services. Tesla's Megapack, for example, can store 3.9 MWh of energy in a single unit.

Beyond lithium-ion, several promising storage technologies are emerging. Iron-air batteries offer the potential for very low-cost, long-duration storage using abundant materials. Flow batteries, which store energy in liquid electrolytes, can scale capacity independently of power output and may be ideal for multi-day storage. Compressed air energy storage, gravity-based systems, and green hydrogen are also being developed for seasonal storage needs that go beyond what batteries can economically provide.

For homeowners, residential battery systems paired with solar panels are becoming increasingly popular. These systems store excess solar energy during the day for use in the evening, provide backup power during outages, and can participate in virtual power plant programs where aggregated home batteries support the grid during peak demand. As costs continue to fall and capabilities improve, battery storage is becoming as fundamental to the clean energy system as generation itself.`,
      'renewable_energy', 6, null
    ],
    [
      'Green Hydrogen: The Fuel of the Future?',
      'Hydrogen produced with renewable energy could decarbonize industries that electricity alone cannot. Explore the promise and challenges of green hydrogen.',
      `Green hydrogen—produced by splitting water molecules using renewable electricity—is emerging as a critical tool for decarbonizing sectors that are difficult or impossible to electrify directly. Heavy industry (steel, cement, chemicals), long-haul shipping, aviation, and seasonal energy storage are all potential applications where green hydrogen could play a transformative role.

The process is conceptually simple: an electrolyzer uses electricity to split water (H2O) into hydrogen (H2) and oxygen (O2). When the electricity comes from renewable sources like solar or wind, the resulting hydrogen is virtually carbon-free. The hydrogen can then be stored, transported, and used in fuel cells to generate electricity, burned for industrial heat, or used as a chemical feedstock. Unlike batteries, hydrogen can store energy for weeks or months without degradation.

The green hydrogen industry is scaling rapidly. Global electrolyzer capacity is expected to grow from about 1 gigawatt today to over 100 GW by 2030, driven by massive investments from governments and private companies. The European Union, Australia, Saudi Arabia, and Chile are all developing major green hydrogen production hubs. As renewable electricity costs continue to fall and electrolyzer technology improves, green hydrogen is approaching cost competitiveness with hydrogen produced from natural gas.

Challenges remain significant. Current electrolysis is about 60-70% efficient, meaning energy is lost in the conversion process. Hydrogen is difficult to store and transport due to its low energy density and tendency to embrittle metals. Building the necessary infrastructure—pipelines, storage facilities, refueling stations—requires enormous investment. However, for the hardest-to-abate sectors, green hydrogen represents one of the most promising pathways to achieve net-zero emissions by mid-century.`,
      'renewable_energy', 8, null
    ],

    // Waste Management (4)
    [
      'The Zero Waste Movement',
      'Zero waste is about redesigning our relationship with stuff. Learn the principles and practical steps toward producing less waste.',
      `The zero waste movement challenges the linear "take-make-dispose" model of consumption that has dominated modern economies. Its goal is not necessarily producing literally zero waste—an almost impossible standard—but rather rethinking our systems and habits to dramatically reduce the amount of material we send to landfills and incinerators. The movement is guided by the "5 Rs" hierarchy: Refuse, Reduce, Reuse, Recycle, and Rot (compost).

The first and most impactful step is refusing what you don't need. This means declining single-use plastics, promotional freebies, junk mail, and unnecessary packaging. The next step is reducing what you do use—buying only what you truly need, choosing products with minimal packaging, and maintaining items to extend their useful life. Reusing comes next: repurposing containers, shopping with reusable bags, choosing refillable products, and buying second-hand whenever possible.

Recycling, while valuable, is lower on the hierarchy because it still requires energy and resources. In many countries, contamination rates in recycling streams are high, and only a fraction of collected recyclables actually get recycled. Understanding your local recycling guidelines and sorting properly dramatically improves recycling effectiveness. Composting organic waste (the "Rot" step) diverts approximately 30% of household waste from landfills while creating valuable soil amendments for gardens.

Cities around the world are embracing zero waste goals. San Francisco diverts over 80% of its waste from landfills. Kamikatsu, Japan, sorts waste into 45 categories and achieves an 80% recycling rate. Ljubljana, Slovenia, went from having no recycling program to becoming Europe's first zero-waste capital in just a decade. These examples show that with commitment, infrastructure, and community engagement, dramatically reducing waste is entirely achievable.`,
      'waste_management', 6, null
    ],
    [
      'Understanding Plastic Pollution',
      'Plastic pollution is one of the most visible environmental crises of our time. Learn where plastic waste goes and what you can do about it.',
      `Since the 1950s, humanity has produced over 8.3 billion metric tons of plastic, and approximately 60% of that has ended up in landfills or the natural environment. Only about 9% of all plastic ever produced has been recycled. Each year, roughly 8-12 million tons of plastic enter the world's oceans, where it persists for hundreds of years, breaking down into ever-smaller fragments but never truly disappearing.

Plastic pollution impacts ecosystems at every scale. Large plastic debris entangles marine animals and is ingested by sea turtles, whales, and seabirds who mistake it for food. Microplastics—fragments smaller than 5 millimeters—have been found in the deepest ocean trenches, Arctic ice, mountain air, human blood, and breast milk. Research is ongoing into the health effects of microplastic exposure in humans, but early findings suggest potential links to inflammation, hormonal disruption, and cellular damage.

The sources of plastic pollution are diverse. Single-use packaging accounts for the largest share, including food wrappers, bottles, bags, and takeout containers. Synthetic textiles shed microfibers during washing—a single load of laundry can release over 700,000 microfibers. Tire wear particles, cigarette filters, and industrial plastic pellets (nurdles) are other significant sources that often fly under the radar.

Solutions require action at multiple levels. Individuals can reduce their plastic footprint by choosing reusable alternatives, avoiding over-packaged products, and recycling correctly. Companies need to redesign products for durability and recyclability, and take responsibility for the full lifecycle of their packaging. Governments are increasingly implementing extended producer responsibility laws, plastic bag bans, and deposit return schemes. The UN is currently negotiating a Global Plastics Treaty that could set binding targets for reducing plastic production and pollution worldwide.`,
      'waste_management', 7, null
    ],
    [
      'Composting 101: Turn Waste into Gold',
      'Composting transforms kitchen scraps into nutrient-rich soil. This beginner\'s guide covers everything you need to start composting at home.',
      `Composting is nature's recycling system—a biological process where microorganisms break down organic matter into a dark, crumbly, nutrient-rich material called humus. By composting at home, you can divert approximately 30% of your household waste from the landfill while creating a valuable soil amendment for your garden. When organic waste decomposes in landfills without oxygen, it produces methane, a greenhouse gas 80 times more potent than CO2 over 20 years. Composting avoids this entirely.

Getting started is simpler than most people think. You need three basic ingredients: "greens" (nitrogen-rich materials like fruit and vegetable scraps, coffee grounds, and fresh grass clippings), "browns" (carbon-rich materials like dried leaves, cardboard, newspaper, and wood chips), and water. The ideal ratio is roughly 3 parts browns to 1 part greens by volume. Avoid composting meat, dairy, oily foods, and pet waste, which can attract pests and create odor problems.

You can compost in several ways depending on your space and preferences. Traditional backyard bins or tumblers work well for houses with yards—simply layer greens and browns, keep the pile moist like a wrung-out sponge, and turn it every week or two to add oxygen. Vermicomposting uses red wiggler worms to process food scraps indoors, making it ideal for apartments. Bokashi fermentation is another indoor option that uses special microorganisms to ferment food waste, including meat and dairy, in an airtight container.

A well-maintained compost pile can produce finished compost in 2-3 months with regular turning, or 6-12 months with a more passive approach. Finished compost improves soil structure, adds nutrients, helps retain moisture, and supports beneficial soil organisms. Use it in garden beds, as potting mix, or as lawn top-dressing. Many municipalities also offer community composting programs for those without space for home composting.`,
      'waste_management', 5, null
    ],
    [
      'The Circular Economy Explained',
      'The circular economy reimagines how we design, use, and recover products. Discover why this model is essential for a sustainable future.',
      `The circular economy is an alternative to the traditional linear economy (make, use, dispose) in which resources are kept in use for as long as possible, maximum value is extracted from them while in use, and products and materials are recovered and regenerated at the end of each service life. This model draws inspiration from natural ecosystems, where waste from one organism becomes food for another.

Three core principles drive the circular economy. First, design out waste and pollution by rethinking products from the start—using non-toxic materials, designing for disassembly, and eliminating unnecessary packaging. Second, keep products and materials in use through maintenance, repair, reuse, remanufacturing, and recycling. Third, regenerate natural systems by returning biological materials to the earth and using renewable energy to power industrial processes.

Real-world examples of circular economy practices are growing rapidly. Patagonia repairs worn clothing and resells used items through its Worn Wear program. Philips offers "lighting as a service," retaining ownership of fixtures and bulbs and ensuring they are maintained, upgraded, and eventually recycled. Interface, a carpet manufacturer, collects old carpets and recycles them into new ones, having diverted millions of pounds from landfills. Cities like Amsterdam and Paris have adopted circular economy strategies covering construction, food systems, and consumer goods.

The economic opportunity is enormous. The Ellen MacArthur Foundation estimates that circular economy practices could generate $4.5 trillion in economic benefits by 2030. For individuals, participating in the circular economy means choosing durable, repairable products, supporting companies with take-back programs, buying second-hand, selling or donating items instead of discarding them, and advocating for right-to-repair legislation. Every purchase decision is a vote for the kind of economy we want to live in.`,
      'waste_management', 7, null
    ],
  ];

  const insertArticles = db.transaction(() => {
    for (const a of articles) {
      insertArticle.run(...a);
    }
  });
  insertArticles();

  // ── Seed Challenges (12) ──────────────────────────────────────────────
  const insertChallenge = db.prepare(`
    INSERT INTO challenges (title, description, points_reward, category, icon, week_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const challenges = [
    ['Meatless Monday', 'Eat no meat for a full day. Try plant-based proteins like beans, lentils, tofu, or tempeh for all your meals.', 50, 'food', 'utensils', 1],
    ['No-Car Tuesday', 'Use only zero-emission transportation for the entire day—walk, bike, or take public transit.', 50, 'transport', 'car', 2],
    ['Energy Detective', 'Find and eliminate at least 3 energy wastes in your home, such as phantom loads, drafty windows, or inefficient lighting.', 75, 'energy', 'search', 3],
    ['Zero Waste Day', 'Produce no disposable waste for 24 hours. Plan meals, bring reusable containers, and refuse single-use items.', 75, 'waste', 'trash', 4],
    ['Local Food Week', 'Buy only locally produced food for an entire week. Visit farmers markets and check the origin labels at grocery stores.', 100, 'food', 'map-pin', 5],
    ['Digital Declutter', 'Delete old files, emails, and unused cloud storage to reduce the energy consumed by data centers storing your digital footprint.', 50, 'energy', 'hard-drive', 6],
    ['Green Commute', 'Walk or bike for all trips under 2 kilometers for the entire week. Discover the joy of human-powered transportation.', 75, 'transport', 'bike', 7],
    ['Meal Prep Master', 'Plan and prep your meals for the week ahead to minimize food waste, reduce packaging, and avoid last-minute takeout.', 75, 'food', 'clipboard', 8],
    ['Power Down Hour', 'Turn off all non-essential electronics for at least 1 hour each day this week. Read, go outside, or connect with people.', 50, 'energy', 'power', 9],
    ['Repair Instead of Replace', 'Fix something you would normally throw away and replace—clothing, electronics, furniture, or household items.', 100, 'waste', 'tool', 10],
    ['Public Transit Pro', 'Use only public transportation for an entire week. Map out routes, discover new connections, and leave the car at home.', 100, 'transport', 'navigation', 11],
    ['Compost Starter', 'Start composting your organic kitchen waste. Set up a bin, learn what to compost, and begin diverting food scraps from landfill.', 75, 'waste', 'flower', 12],
  ];

  const insertChallenges = db.transaction(() => {
    for (const c of challenges) {
      insertChallenge.run(...c);
    }
  });
  insertChallenges();

  console.log('Database seeded successfully!');
  console.log('  - 24 eco-actions');
  console.log('  - 12 badges');
  console.log('  - 16 articles');
  console.log('  - 12 challenges');
}

module.exports = { seedDB };
