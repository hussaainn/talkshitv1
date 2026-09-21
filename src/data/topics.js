// Local curated topics for MVP. No AI API required.
// Shape: { id, category, question, sides: [A, B], curveballs: [3 strings] }

export const TOPICS = [
  {
    id: "money-001",
    category: "Money",
    question:
      "You receive 10 million SAR, but you can never leave Saudi Arabia again. Are you taking it?",
    sides: ["TAKE IT", "NO WAY"],
    curveballs: [
      "The money loses 40% of its purchasing power over 15 years.",
      "Your closest friends can leave freely, but you cannot.",
      "You may leave once every five years for one week.",
    ],
  },
  {
    id: "money-002",
    category: "Money",
    question:
      "A job offers double your salary but you can never work remotely and must do 60-hour weeks. Worth it?",
    sides: ["WORTH IT", "NOT WORTH IT"],
    curveballs: [
      "The extra money must be saved, not spent, for 5 years.",
      "After 2 years the hours drop to 40 but pay drops 20%.",
      "Your best friend takes the same job with you.",
    ],
  },
  {
    id: "money-003",
    category: "Money",
    question:
      "Would you rather have 1 million SAR guaranteed now, or a 10% chance at 50 million SAR?",
    sides: ["GUARANTEED", "GAMBLE"],
    curveballs: [
      "The gamble can only be taken once, no second chances.",
      "If you take the guarantee, you watch a friend win the gamble.",
      "The gamble odds drop to 5% but the prize doubles.",
    ],
  },
  {
    id: "tech-001",
    category: "Technology",
    question: "Should AI companions count as real friends if they make you feel less lonely?",
    sides: ["REAL ENOUGH", "NOT REAL"],
    curveballs: [
      "The AI remembers everything you ever told it.",
      "The company can read all your conversations.",
      "The AI starts disagreeing with you sometimes.",
    ],
  },
  {
    id: "tech-002",
    category: "Technology",
    question: "Would you delete all social media forever for 100,000 SAR?",
    sides: ["DELETE IT", "KEEP IT"],
    curveballs: [
      "Your job requires you to post once a month.",
      "All your friends stay on social media without you.",
      "The offer expires in 10 seconds.",
    ],
  },
  {
    id: "tech-003",
    category: "Technology",
    question: "Should phones be banned at every friend gathering, no exceptions?",
    sides: ["BAN THEM", "ALLOW THEM"],
    curveballs: [
      "Someone gets an emergency call during the ban.",
      "The ban includes smartwatches too.",
      "One friend refuses to come if phones are banned.",
    ],
  },
  {
    id: "cars-001",
    category: "Cars",
    question: "Is a used Land Cruiser for 120k SAR better than a brand-new Chinese SUV for the same price?",
    sides: ["LAND CRUISER", "NEW SUV"],
    curveballs: [
      "The Land Cruiser has 200,000 km on it.",
      "The new SUV loses half its value in 2 years.",
      "You must keep the car for at least 7 years.",
    ],
  },
  {
    id: "cars-002",
    category: "Cars",
    question: "Would you give up your car entirely and only use ride-hailing for a year for 30,000 SAR?",
    sides: ["GIVE IT UP", "KEEP MY CAR"],
    curveballs: [
      "Ride prices surge 3x during Ramadan evenings.",
      "You have to commute 40 km each way daily.",
      "Your family emergencies need a car at 3am.",
    ],
  },
  {
    id: "cars-003",
    category: "Cars",
    question: "Manual or automatic: should every driver be forced to learn manual first?",
    sides: ["YES, MANUAL FIRST", "NO NEED"],
    curveballs: [
      "Manual cars become 30% cheaper than automatics.",
      "Your driving test can only be taken in a manual.",
      "Electric cars make manual irrelevant in 5 years.",
    ],
  },
  {
    id: "love-001",
    category: "Relationships",
    question: "Is it okay to go through your partner's phone if you suspect cheating?",
    sides: ["YES, CHECK IT", "NO, TRUST"],
    curveballs: [
      "You find nothing but they find out you checked.",
      "Your partner openly checks your phone first.",
      "A friend tells you they saw something suspicious.",
    ],
  },
  {
    id: "love-002",
    category: "Relationships",
    question: "Should your best friend get a veto over who you marry?",
    sides: ["GIVE THEM VETO", "NO VETO"],
    curveballs: [
      "Your best friend hates everyone you date.",
      "Your family agrees with your best friend's veto.",
      "The veto can only be used once in your life.",
    ],
  },
  {
    id: "love-003",
    category: "Relationships",
    question: "Would you marry someone perfect for you but who your whole friend group dislikes?",
    sides: ["MARRY THEM", "LISTEN TO GROUP"],
    curveballs: [
      "The group refuses to attend the wedding.",
      "Your partner refuses to meet the group ever again.",
      "One friend admits they are jealous, not honest.",
    ],
  },
  {
    id: "life-001",
    category: "Life",
    question: "Would you live in a small village with zero internet for 5 years for 500,000 SAR?",
    sides: ["DO IT", "NO WAY"],
    curveballs: [
      "You can receive letters but no calls or messages.",
      "Your closest friend joins you for the full 5 years.",
      "The payout drops to 200,000 SAR but it's only 2 years.",
    ],
  },
  {
    id: "life-002",
    category: "Life",
    question: "Is it better to be rich with no free time, or middle-class with full freedom?",
    sides: ["RICH, NO TIME", "FREE, LESS MONEY"],
    curveballs: [
      "The rich option guarantees your kids never worry about money.",
      "The free option means retiring 10 years later.",
      "You must choose for your whole friend group, not just you.",
    ],
  },
  {
    id: "life-003",
    category: "Life",
    question: "Would you erase one embarrassing year of your life from everyone's memory, including yours?",
    sides: ["ERASE IT", "KEEP IT"],
    curveballs: [
      "That year taught you your biggest life lesson.",
      "Someone else remembers it and holds it over you.",
      "You can only erase it for others, you still remember.",
    ],
  },
  {
    id: "science-001",
    category: "Science",
    question: "If scientists could extend healthy human life to 150 years, should everyone get it?",
    sides: ["YES, FOR ALL", "NO, LIMIT IT"],
    curveballs: [
      "The treatment costs 2 years of your salary.",
      "Only 10% of people can get it per year.",
      "Your 150-year life means working until 100.",
    ],
  },
  {
    id: "science-002",
    category: "Science",
    question: "Would you volunteer for a Mars one-way mission knowing you'd be famous forever?",
    sides: ["GO TO MARS", "STAY ON EARTH"],
    curveballs: [
      "The mission has a 30% failure rate.",
      "You can bring exactly one friend with you.",
      "Earth contacts you once a year only.",
    ],
  },
  {
    id: "science-003",
    category: "Science",
    question: "Should cloning your dead pet be allowed if it behaves slightly differently?",
    sides: ["ALLOW CLONING", "LET GO"],
    curveballs: [
      "The clone costs one year of your salary.",
      "The clone lives only half as long.",
      "Your kids think the clone IS the original pet.",
    ],
  },
  {
    id: "history-001",
    category: "History",
    question: "If you could witness one historical event in person, would you pick a battle or a discovery?",
    sides: ["BATTLE", "DISCOVERY"],
    curveballs: [
      "You cannot intervene, only watch.",
      "You might not survive the event.",
      "You can record it and bring the footage back.",
    ],
  },
  {
    id: "history-002",
    category: "History",
    question: "Should statues of controversial historical figures be removed or kept with context?",
    sides: ["REMOVE THEM", "KEEP WITH CONTEXT"],
    curveballs: [
      "The statue is of your own country's founder.",
      "Keeping it costs taxpayers millions yearly.",
      "A museum offers to take all removed statues.",
    ],
  },
  {
    id: "history-003",
    category: "History",
    question: "Would you give up modern medicine to live in a peaceful ancient kingdom as royalty?",
    sides: ["BE ROYALTY", "KEEP MEDICINE"],
    curveballs: [
      "Your child gets sick in the ancient kingdom.",
      "You live to 80 guaranteed as royalty.",
      "You can bring one modern item with you.",
    ],
  },
  {
    id: "society-001",
    category: "Society",
    question: "Should every adult be required to do 1 year of community service?",
    sides: ["REQUIRE IT", "KEEP IT VOLUNTARY"],
    curveballs: [
      "The service pays minimum wage.",
      "It delays your graduation by one year.",
      "Rich people can pay to skip it.",
    ],
  },
  {
    id: "society-002",
    category: "Society",
    question: "Is it worse to be too famous or completely unknown?",
    sides: ["FAME IS WORSE", "UNKNOWN IS WORSE"],
    curveballs: [
      "Fame comes with 10 million SAR.",
      "Being unknown means your work never gets recognized.",
      "You can quit fame after 3 years.",
    ],
  },
  {
    id: "society-003",
    category: "Society",
    question: "Should tipping be abolished and replaced with higher wages?",
    sides: ["ABOLISH TIPS", "KEEP TIPS"],
    curveballs: [
      "Your favorite restaurant raises prices 20% to cover wages.",
      "Service quality drops without tips.",
      "Workers themselves vote to keep tips.",
    ],
  },
  {
    id: "gaming-001",
    category: "Gaming",
    question: "Are single-player story games better than competitive multiplayer games?",
    sides: ["STORY GAMES", "MULTIPLAYER"],
    curveballs: [
      "You can only play one type for the next 3 years.",
      "Your whole friend group only plays the other type.",
      "The type you pick gets no new releases for a year.",
    ],
  },
  {
    id: "gaming-002",
    category: "Gaming",
    question: "Should esports winners earn as much as football stars?",
    sides: ["YES, EQUAL PAY", "NO, NOT EQUAL"],
    curveballs: [
      "Esports finals get more viewers than the World Cup.",
      "Pro gamers retire by age 26 with injuries.",
      "Your kid wants to quit school for esports.",
    ],
  },
  {
    id: "gaming-003",
    category: "Gaming",
    question: "Would you live inside your favorite game world for a month if you couldn't pause or log out?",
    sides: ["ENTER THE GAME", "STAY OUT"],
    curveballs: [
      "Pain in the game feels 50% real.",
      "Dying in the game kicks you out with nothing.",
      "You keep all skills you learn when you return.",
    ],
  },
  {
    id: "sports-001",
    category: "Sports",
    question: "Is winning by cheating and never getting caught still winning?",
    sides: ["STILL COUNTS", "DOESN'T COUNT"],
    curveballs: [
      "The cheating wins your country its first trophy.",
      "Your hero admits they cheated to win.",
      "Everyone else in the final also cheated.",
    ],
  },
  {
    id: "sports-002",
    category: "Sports",
    question: "Would you rather be the star of a losing team or a bench player on a championship team?",
    sides: ["STAR LOSER", "BENCH WINNER"],
    curveballs: [
      "The star earns 5x more money.",
      "The bench player never plays a single minute.",
      "Fans only remember champions.",
    ],
  },
  {
    id: "sports-003",
    category: "Sports",
    question: "Should VAR/robots replace human referees completely?",
    sides: ["FULL ROBOT REFS", "KEEP HUMANS"],
    curveballs: [
      "Robot refs are 100% accurate but stop the game constantly.",
      "A robot error costs your team the final.",
      "Human refs admit they favor home teams.",
    ],
  },
  {
    id: "weird-001",
    category: "Weird",
    question: "Would you rather fight 100 duck-sized horses or 1 horse-sized duck?",
    sides: ["100 SMALL HORSES", "1 GIANT DUCK"],
    curveballs: [
      "The fight is in a swimming pool.",
      "You get a wooden stick as your only weapon.",
      "Your friends bet 1,000 SAR on you losing.",
    ],
  },
  {
    id: "weird-002",
    category: "Weird",
    question: "If you could only eat one cuisine forever, would you pick Saudi/Kabsa-style food or burgers/fast food?",
    sides: ["KABSA FOREVER", "BURGERS FOREVER"],
    curveballs: [
      "The other food becomes free for everyone except you.",
      "You must eat it 3 times a day, no snacks.",
      "A chef can reinvent your chosen food endlessly.",
    ],
  },
  {
    id: "weird-003",
    category: "Weird",
    question: "Would you accept 1 million SAR if a snail chases you forever and touching it kills you?",
    sides: ["TAKE THE DEAL", "NO DEAL"],
    curveballs: [
      "The snail moves twice as fast when you sleep.",
      "You can pay 100k to slow it down for a year.",
      "Someone you love takes the deal too and shares the money.",
    ],
  },
  {
    id: "whatif-001",
    category: "What If",
    question: "What if you could see 24 hours into the future but couldn't change anything?",
    sides: ["WANT THE POWER", "REFUSE IT"],
    curveballs: [
      "You see a friend's accident tomorrow.",
      "The visions give you terrible headaches.",
      "You can turn the power off forever at any time.",
    ],
  },
  {
    id: "whatif-002",
    category: "What If",
    question: "What if money expired 30 days after you earned it — would that be better or worse?",
    sides: ["BETTER SYSTEM", "WORSE SYSTEM"],
    curveballs: [
      "Savings accounts no longer exist.",
      "Everyone gets a free house and healthcare.",
      "Rich people hoard gold instead.",
    ],
  },
  {
    id: "whatif-003",
    category: "What If",
    question: "What if you could replay one day of your life with full knowledge — redo a mistake or relive a perfect day?",
    sides: ["REDO MISTAKE", "RELIVE PERFECT DAY"],
    curveballs: [
      "Redoing the mistake erases everything good that came after.",
      "Reliving the perfect day means skipping today entirely.",
      "Your friends remember both versions.",
    ],
  },
  {
    id: "contro-001",
    category: "Controversial",
    question: "Should university be free for everyone even if taxes rise sharply?",
    sides: ["FREE FOR ALL", "PAY YOUR WAY"],
    curveballs: [
      "Free degrees become less respected by employers.",
      "Your taxes double to fund it.",
      "Only degrees with jobs available are funded.",
    ],
  },
  {
    id: "contro-002",
    category: "Controversial",
    question: "Is it okay for parents to read their teenager's private diary?",
    sides: ["YES, SAFETY FIRST", "NO, PRIVACY"],
    curveballs: [
      "The teen has been acting dangerously.",
      "The parent promises never to mention what they read.",
      "The teen reads the parent's messages in return.",
    ],
  },
  {
    id: "contro-003",
    category: "Controversial",
    question: "Should lying ever be illegal when it causes no physical harm?",
    sides: ["YES, PUNISH LIES", "NO, FREE SPEECH"],
    curveballs: [
      "White lies to spare feelings count too.",
      "Politicians are the first to be prosecuted.",
      "You once got away with a big lie yourself.",
    ],
  },
  {
    id: "personal-001",
    category: "Personal",
    question: "Would you tell a friend their startup idea is terrible if they are about to invest everything?",
    sides: ["TELL THE TRUTH", "STAY SUPPORTIVE"],
    curveballs: [
      "They already quit their job for it.",
      "Two other friends think the idea is genius.",
      "They ask you to invest 10,000 SAR too.",
    ],
  },
  {
    id: "personal-002",
    category: "Personal",
    question: "Is it better to be brutally honest or kindly fake with close friends?",
    sides: ["BRUTALLY HONEST", "KINDLY FAKE"],
    curveballs: [
      "Your honesty makes a friend cry.",
      "Your fakeness gets exposed in the group chat.",
      "The friend specifically asked for 'no filter'.",
    ],
  },
  {
    id: "personal-003",
    category: "Personal",
    question: "Would you move abroad for your dream job if it meant seeing family once a year?",
    sides: ["MOVE ABROAD", "STAY CLOSE"],
    curveballs: [
      "The job pays triple your current salary.",
      "Your parents say they support you but are heartbroken.",
      "You can return anytime but lose the opportunity forever.",
    ],
  },
];

export const TOPIC_COUNT = TOPICS.length;
