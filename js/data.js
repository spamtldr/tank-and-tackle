// ============ Tank & Tackle: game data (real species, gear, economy) ============
const ROOM_T = 68;
const TEMPS = {
  cold: { name: 'Coldwater', min: 48, max: 60, ideal: [52, 58] },
  cool: { name: 'Coolwater', min: 55, max: 70, ideal: [60, 66] },
  warm: { name: 'Warmwater', min: 68, max: 84, ideal: [74, 80] },
  salt: { name: 'Saltwater', min: 60, max: 80, ideal: [66, 74] }
};
const TIMES = {
  day: { name: 'Daytime', m: { dawn: 1, day: 1.3, dusk: 1, night: .3 } },
  dawnDusk: { name: 'Dawn and dusk', m: { dawn: 1.8, day: .7, dusk: 1.8, night: .6 } },
  lowlight: { name: 'Low light: dawn, dusk and night', m: { dawn: 1.5, day: .5, dusk: 1.5, night: 1.4 } },
  night: { name: 'Night', m: { dawn: .8, day: .3, dusk: 1.1, night: 1.8 } },
  any: { name: 'Any time of day', m: { dawn: 1, day: 1, dusk: 1, night: 1 } }
};
const FIGHTS = {
  gentle: 'Gentle. Steady little tugs, easy to land.',
  runner: 'Runner. Makes long, fast runs. Ease off the reel while it runs.',
  jumper: 'Jumper. Leaps out of the water. Stop reeling when it jumps or it throws the hook.',
  digger: 'Digger. Heavy, steady pull toward the bottom. Reel in short bursts.',
  thrasher: 'Thrasher. Violent head shakes that spike the line tension.'
};
const DIETS = {
  insect: 'Insects and other small bugs',
  omni: 'A bit of everything',
  pred: 'Other fish (a predator)',
  bottom: 'Bottom feeder: scavenges whatever sinks'
};

// look: s=shape, b=back, m=side, u=belly, st=stripe, bars, sp=spots, f=fins
const SPECIES = [
  { id: 'bluegill', name: 'Bluegill', sci: 'Lepomis macrochirus', water: 'fresh', temp: 'warm', adult: 7, big: 10, c: .0011, val: 34, fry: 15, growH: 1.5, feedH: 2, diet: 'insect', fight: 'gentle', time: 'day', rain: 1,
    bait: { worm: 1, cricket: 1.4, fly: .8, jig: .6 }, spots: { lake: 26 },
    range: 'Native to the eastern and central US; stocked in ponds everywhere.', habitat: 'Weedy shallows of ponds and lakes.', eats: 'Insects, larvae, tiny crustaceans.',
    fact: 'A kind of sunfish. Males fan out round nests in the shallows, often in big colonies, and guard the eggs. State fish of Illinois.',
    look: { s: 'sun', b: '#2c4a5a', m: '#6f8fa8', u: '#f08a3c', bars: '#3a4f5c', f: '#3b5566' } },
  { id: 'pumpkinseed', name: 'Pumpkinseed', sci: 'Lepomis gibbosus', water: 'fresh', temp: 'warm', adult: 6, big: 9, c: .0011, val: 38, fry: 17, growH: 1.5, feedH: 2, diet: 'insect', fight: 'gentle', time: 'day', rain: 1,
    bait: { worm: 1.2, cricket: 1.2, fly: .7 }, spots: { lake: 18 },
    range: 'Eastern North America, from Canada down to the Carolinas.', habitat: 'Clear, weedy, warm shallows.', eats: 'Snails, insects, small crustaceans.',
    fact: 'Look for the bright orange-red spot on its gill flap. It has tough teeth in its throat for crunching snail shells.',
    look: { s: 'sun', b: '#5e6b3a', m: '#c9a44a', u: '#f2a43a', sp: '#d8693a', f: '#7a6a3a' } },
  { id: 'perch', name: 'Yellow Perch', sci: 'Perca flavescens', water: 'fresh', temp: 'cool', adult: 9, big: 13, c: .00055, val: 45, fry: 20, growH: 2, feedH: 2, diet: 'omni', fight: 'gentle', time: 'day', rain: 1,
    bait: { worm: 1.3, minnow: 1.1, jig: 1.3, cricket: .8 }, spots: { lake: 18, ice: 22 }, depth: [4, 16],
    range: 'Northern US and Canada, including the Great Lakes.', habitat: 'Cool lakes; travels in schools.', eats: 'Insects, small fish, crayfish.',
    fact: 'Known for 6 to 8 dark bars across gold sides. Perch travel in schools, so where you catch one there are usually more.',
    look: { s: 'perch', b: '#5a6a2a', m: '#d9b93a', u: '#f2e6b0', bars: '#2f3a1a', f: '#e0782f' } },
  { id: 'crappie', name: 'Black Crappie', sci: 'Pomoxis nigromaculatus', water: 'fresh', temp: 'warm', adult: 10, big: 15, c: .0007, val: 55, fry: 24, growH: 2.5, feedH: 2.5, diet: 'omni', fight: 'gentle', time: 'dawnDusk', rain: 1,
    bait: { minnow: 1.4, jig: 1.3, worm: .8 }, spots: { lake: 10, bayou: 16 },
    range: 'Eastern and central North America; stocked widely.', habitat: 'Around brush, docks and sunken timber.', eats: 'Small fish, insects, zooplankton.',
    fact: 'Covered in black speckles. Crappie gather in big schools in spring and feed most at dawn and dusk.',
    look: { s: 'sun', b: '#3a4a3a', m: '#b9c2b0', u: '#e8ece0', sp: '#1f2a1f', f: '#2f3a2f' } },
  { id: 'largemouth', name: 'Largemouth Bass', sci: 'Micropterus salmoides', water: 'fresh', temp: 'warm', adult: 16, big: 24, c: .0006, val: 140, fry: 60, growH: 4, feedH: 3, diet: 'pred', fight: 'jumper', time: 'dawnDusk', rain: 1.4,
    bait: { minnow: 1.3, crank: 1.5, spinner: 1.2, worm: .7 }, spots: { lake: 12, bayou: 14 },
    range: 'Native to the eastern US; now found in all lower 48 states.', habitat: 'Warm, weedy lakes and ponds.', eats: 'Fish, frogs, crayfish, almost anything that fits.',
    fact: 'Its upper jaw reaches past the eye, which is how you tell it from a smallmouth. State fish of Georgia and Mississippi.',
    look: { s: 'bass', b: '#3f5a2a', m: '#8fa05a', u: '#e8e6c8', st: '#2c3a1c', f: '#5a6a3a' } },
  { id: 'smallmouth', name: 'Smallmouth Bass', sci: 'Micropterus dolomieu', water: 'fresh', temp: 'cool', adult: 15, big: 21, c: .0006, val: 150, fry: 65, growH: 4, feedH: 3, diet: 'pred', fight: 'jumper', time: 'day', rain: 1.2,
    bait: { crank: 1.4, minnow: 1.3, spinner: 1.2, jig: 1, worm: .8 }, spots: { river: 24 },
    range: 'Native to the Great Lakes and Mississippi River basins.', habitat: 'Clear, rocky rivers and lakes.', eats: 'Crayfish, small fish, insects.',
    fact: 'Bronze with dark vertical bars. Pound for pound one of the hardest-fighting freshwater fish, famous for jumping.',
    look: { s: 'bass', b: '#5a4a2a', m: '#a8884a', u: '#e8dcb8', bars: '#4a3a1e', f: '#7a5a32' } },
  { id: 'rainbow', name: 'Rainbow Trout', sci: 'Oncorhynchus mykiss', water: 'fresh', temp: 'cold', adult: 16, big: 26, c: .0005, val: 160, fry: 70, growH: 4, feedH: 3, diet: 'insect', fight: 'jumper', time: 'dawnDusk', rain: 1.3,
    bait: { worm: 1, spinner: 1.2, fly: 1.5, spoon: 1, cricket: .6 }, spots: { lake: 12, creek: 18 },
    range: 'Native to cold Pacific-draining rivers of North America; stocked across the US.', habitat: 'Cold, oxygen-rich lakes and streams.', eats: 'Insects, fish eggs, small fish.',
    fact: 'Named for the pink band down its side. The same species that runs out to sea and comes back big is called a steelhead.',
    look: { s: 'trout', b: '#4a6a5a', m: '#a8bcae', u: '#ecefe8', st: '#e07a8a', sp: '#2a3a32', f: '#8a9a8e' } },
  { id: 'brown', name: 'Brown Trout', sci: 'Salmo trutta', water: 'fresh', temp: 'cold', adult: 17, big: 28, c: .0005, val: 210, fry: 90, growH: 5, feedH: 3, diet: 'pred', fight: 'runner', time: 'lowlight', rain: 1.2,
    bait: { minnow: 1.3, spinner: 1.2, worm: 1, fly: 1, crank: 1 }, spots: { lake: 6, creek: 8 },
    range: 'Native to Europe and western Asia; first brought to US waters in 1883.', habitat: 'Cold streams and deep lakes.', eats: 'Insects when young, mostly fish once big.',
    fact: 'Wary and smart. Big browns feed mostly at dusk and through the night.',
    look: { s: 'trout', b: '#5a4a2a', m: '#c09a5a', u: '#f0e0b0', sp: '#3a2410', f: '#9a7a4a' } },
  { id: 'brook', name: 'Brook Trout', sci: 'Salvelinus fontinalis', water: 'fresh', temp: 'cold', adult: 11, big: 18, c: .0005, val: 150, fry: 65, growH: 3.5, feedH: 2.5, diet: 'insect', fight: 'runner', time: 'dawnDusk', rain: 1.2,
    bait: { worm: 1.2, fly: 1.4, spinner: 1, cricket: .9 }, spots: { creek: 28 },
    range: 'Eastern North America, from Georgia up to Hudson Bay.', habitat: 'Very cold, clean streams and ponds.', eats: 'Insects, worms, small fish.',
    fact: 'Actually a char, not a true trout. It needs very cold, clean water, so finding brookies means the stream is healthy.',
    look: { s: 'trout', b: '#3a4a2a', m: '#7a8a4a', u: '#f0803a', sp: '#e8d870', f: '#e0602a' } },
  { id: 'cutthroat', name: 'Cutthroat Trout', sci: 'Oncorhynchus clarkii', water: 'fresh', temp: 'cold', adult: 14, big: 22, c: .0005, val: 190, fry: 80, growH: 4.5, feedH: 3, diet: 'insect', fight: 'runner', time: 'day', rain: 1.1,
    bait: { fly: 1.5, spinner: 1.1, worm: 1 }, spots: { creek: 18 },
    range: 'Western North America, from Alaska to New Mexico.', habitat: 'Cold mountain streams and lakes.', eats: 'Insects, small fish.',
    fact: 'Named for the red-orange slash under its jaw. Several kinds are state fish across the West.',
    look: { s: 'trout', b: '#5a6a3a', m: '#c8b07a', u: '#f0d8c0', st: '#d8a07a', sp: '#2a2a1a', f: '#a89060' } },
  { id: 'grayling', name: 'Arctic Grayling', sci: 'Thymallus arcticus', water: 'fresh', temp: 'cold', adult: 13, big: 19, c: .00045, val: 230, fry: 100, growH: 4.5, feedH: 2.5, diet: 'insect', fight: 'gentle', time: 'day', rain: 1,
    bait: { fly: 1.6, spinner: .9, worm: .8 }, spots: { creek: 10 },
    range: 'Alaska, northern Canada, and a few cold rivers in Montana.', habitat: 'Clear, very cold rivers and lakes.', eats: 'Mostly insects off the surface.',
    fact: 'Famous for its huge sail-like back fin, speckled with blue and purple. It only lives in cold, clean water.',
    look: { s: 'grayling', b: '#4a4a5a', m: '#9aa0b4', u: '#e0e0e8', sp: '#2a2a3a', f: '#7a5aa8' } },
  { id: 'walleye', name: 'Walleye', sci: 'Sander vitreus', water: 'fresh', temp: 'cool', adult: 18, big: 28, c: .00045, val: 180, fry: 75, growH: 5, feedH: 3, diet: 'pred', fight: 'digger', time: 'lowlight', rain: 1.1,
    bait: { minnow: 1.4, jig: 1.3, crank: 1, worm: .8 }, spots: { river: 16, ice: 18 }, depth: [12, 28],
    range: 'Canada and the northern and central US.', habitat: 'Large lakes and rivers.', eats: 'Small fish.',
    fact: 'Its big, glassy eyes reflect light like a cat’s, letting it hunt in dim water. That is why it bites best at dawn, dusk and night.',
    look: { s: 'perch', b: '#5a5a2a', m: '#b0a05a', u: '#eee8d0', bars: '#4a4220', f: '#8a7a3a' } },
  { id: 'channel', name: 'Channel Catfish', sci: 'Ictalurus punctatus', water: 'fresh', temp: 'warm', adult: 20, big: 36, c: .00045, val: 170, fry: 60, growH: 5, feedH: 4, diet: 'bottom', fight: 'digger', time: 'night', rain: 1.2,
    bait: { cutbait: 1.5, worm: .9, minnow: 1.1, shrimp: 1 }, spots: { river: 18, bayou: 12 },
    range: 'Central and eastern North America; widely stocked.', habitat: 'Rivers, lakes and ponds with soft bottoms.', eats: 'Almost anything: fish, insects, plants, scraps.',
    fact: 'A catfish “tastes” with its whole body: it has taste buds all over its skin, plus whisker-like barbels to find food in muddy water.',
    look: { s: 'cat', b: '#4a5260', m: '#8a94a4', u: '#e8eaf0', sp: '#2a3040', f: '#5a6270' } },
  { id: 'carp', name: 'Common Carp', sci: 'Cyprinus carpio', water: 'fresh', temp: 'warm', adult: 22, big: 34, c: .0006, val: 90, fry: 30, growH: 5, feedH: 4, diet: 'bottom', fight: 'digger', time: 'day', rain: 1,
    bait: { worm: 1.2, cricket: .6 }, spots: { river: 14 },
    range: 'Native to Europe and Asia; now in rivers across the US.', habitat: 'Slow, warm rivers and lakes.', eats: 'Plants, insects and scraps it roots out of the mud.',
    fact: 'Big golden scales and two pairs of barbels. Carp can live for decades and pull like a truck.',
    look: { s: 'carp', b: '#6a5a2a', m: '#c8a04a', u: '#f0e0b0', f: '#8a6a3a' } },
  { id: 'steelhead', name: 'Steelhead', sci: 'Oncorhynchus mykiss', water: 'fresh', temp: 'cold', adult: 26, big: 36, c: .0005, val: 320, fry: 0, growH: 6, feedH: 3, diet: 'pred', fight: 'jumper', time: 'dawnDusk', rain: 1.5,
    bait: { spoon: 1.4, spinner: 1.2, minnow: 1.1, fly: 1 }, spots: { river: 6 },
    range: 'Pacific coast rivers and the Great Lakes.', habitat: 'Big rivers it returns to from the sea or a large lake.', eats: 'Fish, insects, fish eggs.',
    fact: 'A sea-run rainbow trout. Unlike most salmon, a steelhead can survive spawning and make the trip more than once.',
    look: { s: 'trout', b: '#3a5a6a', m: '#c0ccd4', u: '#f4f6f8', st: '#c07a8a', sp: '#2a3a42', f: '#8a9aa4' } },
  { id: 'bluecat', name: 'Blue Catfish', sci: 'Ictalurus furcatus', water: 'fresh', temp: 'warm', adult: 28, big: 50, c: .0005, val: 280, fry: 0, growH: 7, feedH: 4, diet: 'bottom', fight: 'digger', time: 'night', rain: 1.1,
    bait: { cutbait: 1.6, minnow: 1.1, shrimp: 1 }, spots: { bayou: 10 },
    range: 'Mississippi, Missouri and Ohio river basins and the Gulf states.', habitat: 'Big, deep rivers and reservoirs.', eats: 'Fish, mussels, crayfish.',
    fact: 'The biggest catfish in North America. Giant blues can top 100 pounds.',
    look: { s: 'cat', b: '#3a4a6a', m: '#7a8aa8', u: '#eef0f6', f: '#4a5a78' } },
  { id: 'flathead', name: 'Flathead Catfish', sci: 'Pylodictis olivaris', water: 'fresh', temp: 'warm', adult: 26, big: 45, c: .0005, val: 260, fry: 0, growH: 7, feedH: 4, diet: 'pred', fight: 'digger', time: 'night', rain: 1,
    bait: { minnow: 1.6, cutbait: .7 }, spots: { river: 0, bayou: 8 },
    range: 'Central US, from the Great Lakes to the Gulf.', habitat: 'Deep holes and log jams in rivers.', eats: 'Live fish.',
    fact: 'A wide, flat head and a lower jaw that sticks out past the upper one. Unlike most catfish, it wants its food alive.',
    look: { s: 'cat', b: '#5a4a2a', m: '#a08a5a', u: '#e8dcb8', sp: '#3a2a14', f: '#6a5a3a' } },
  { id: 'gar', name: 'Spotted Gar', sci: 'Lepisosteus oculatus', water: 'fresh', temp: 'warm', adult: 24, big: 36, c: .00015, val: 200, fry: 0, growH: 6, feedH: 4, diet: 'pred', fight: 'thrasher', time: 'day', rain: 1,
    bait: { minnow: 1.3, cutbait: 1 }, spots: { bayou: 16 },
    range: 'Gulf states and the Mississippi valley up to the Great Lakes.', habitat: 'Clear, weedy backwaters and swamps.', eats: 'Small fish and crayfish.',
    fact: 'An ancient kind of fish covered in hard, diamond-shaped armor scales. It can gulp air at the surface when the water gets low on oxygen.',
    look: { s: 'gar', b: '#4a4a2a', m: '#9a9a6a', u: '#e8e8d0', sp: '#1a1a10', f: '#6a6a3a' } },
  { id: 'bowfin', name: 'Bowfin', sci: 'Amia calva', water: 'fresh', temp: 'warm', adult: 22, big: 30, c: .00045, val: 190, fry: 0, growH: 6, feedH: 3, diet: 'pred', fight: 'thrasher', time: 'dawnDusk', rain: 1.1,
    bait: { minnow: 1.2, worm: .8, spinner: .8 }, spots: { bayou: 16 },
    range: 'Eastern North America, from the Great Lakes to Florida.', habitat: 'Swamps, sloughs and weedy backwaters.', eats: 'Fish, frogs, crayfish.',
    fact: 'A “living fossil” with a long fin running down its back. It can breathe air, and males have a dark eyespot near the tail.',
    look: { s: 'bowfin', b: '#3a4a2a', m: '#7a8a5a', u: '#d8dcc0', f: '#4a5a3a' } },
  { id: 'reddrum', name: 'Red Drum', sci: 'Sciaenops ocellatus', water: 'salt', temp: 'salt', adult: 27, big: 45, c: .00045, val: 220, fry: 0, growH: 6, feedH: 3, diet: 'pred', fight: 'runner', time: 'any', rain: 1.2,
    bait: { shrimp: 1.4, cutbait: 1.3, minnow: 1, spoon: 1 }, spots: { pier: 18 },
    range: 'Atlantic and Gulf coasts, from Massachusetts to Mexico.', habitat: 'Surf, inlets and shallow bays.', eats: 'Crabs, shrimp, small fish.',
    fact: 'Has a black spot near its tail that fools predators into attacking the wrong end. Big ones are called “bull reds.”',
    look: { s: 'drum', b: '#8a4a2a', m: '#d88a5a', u: '#f4e8dc', sp: '#111111', f: '#a8604a' } },
  { id: 'striper', name: 'Striped Bass', sci: 'Morone saxatilis', water: 'salt', temp: 'salt', adult: 24, big: 45, c: .00045, val: 260, fry: 0, growH: 6, feedH: 3, diet: 'pred', fight: 'runner', time: 'lowlight', rain: 1.2,
    bait: { cutbait: 1.2, spoon: 1.2, minnow: 1.1, shrimp: .8 }, spots: { pier: 14 },
    range: 'Atlantic coast from Canada to Florida; stocked in many lakes.', habitat: 'Coastal waters; swims up rivers to spawn.', eats: 'Fish, squid, crabs.',
    fact: 'Seven or eight dark stripes run nose to tail. It lives in salt water but spawns in fresh-water rivers.',
    look: { s: 'bass', b: '#4a5a6a', m: '#c8d0d8', u: '#f4f6f8', st: '#2a3038', f: '#7a8a98' } },
  { id: 'flounder', name: 'Summer Flounder', sci: 'Paralichthys dentatus', water: 'salt', temp: 'salt', adult: 17, big: 26, c: .0005, val: 180, fry: 0, growH: 5, feedH: 3, diet: 'pred', fight: 'digger', time: 'day', rain: 1,
    bait: { minnow: 1.3, shrimp: 1.1, cutbait: .9 }, spots: { pier: 14 },
    range: 'Atlantic coast from Nova Scotia to Florida.', habitat: 'Sandy and muddy bottoms near shore.', eats: 'Small fish, squid, shrimp.',
    fact: 'Both eyes are on one side of its head. It lies flat on the bottom and changes color to match the sand.',
    look: { s: 'flat', b: '#7a6a4a', m: '#a8987a', u: '#f4f0e8', sp: '#4a3a2a', f: '#8a7a5a' } },
  { id: 'blackdrum', name: 'Black Drum', sci: 'Pogonias cromis', water: 'salt', temp: 'salt', adult: 20, big: 40, c: .0006, val: 160, fry: 0, growH: 6, feedH: 4, diet: 'bottom', fight: 'digger', time: 'any', rain: 1,
    bait: { shrimp: 1.5, cutbait: 1 }, spots: { pier: 12 },
    range: 'Atlantic and Gulf coasts.', habitat: 'Bays, piers and surf with shellfish beds.', eats: 'Clams, oysters, crabs, shrimp.',
    fact: 'Makes a loud drumming sound with its swim bladder. Chin barbels help it find shellfish, which it crushes with strong teeth.',
    look: { s: 'drum', b: '#2a2a2a', m: '#6a6a6a', u: '#d8d8d8', bars: '#1a1a1a', f: '#3a3a3a' } },
  { id: 'croaker', name: 'Atlantic Croaker', sci: 'Micropogonias undulatus', water: 'salt', temp: 'salt', adult: 10, big: 16, c: .0006, val: 40, fry: 0, growH: 3, feedH: 2, diet: 'bottom', fight: 'gentle', time: 'any', rain: 1,
    bait: { shrimp: 1.4, worm: 1, cutbait: 1 }, spots: { pier: 24 },
    range: 'Atlantic coast from Massachusetts to the Gulf.', habitat: 'Sandy and muddy bottoms in bays and surf.', eats: 'Worms, shrimp, small crabs.',
    fact: 'Named for the croaking noise it makes. Pull one in and you will hear it.',
    look: { s: 'drum', b: '#8a7a5a', m: '#d8c8a0', u: '#f4ecdc', sp: '#6a5a3a', f: '#b8a070' } },
  { id: 'pike', name: 'Northern Pike', sci: 'Esox lucius', water: 'fresh', temp: 'cool', adult: 26, big: 42, c: .00025, val: 240, fry: 0, growH: 6, feedH: 4, diet: 'pred', fight: 'thrasher', time: 'day', rain: 1,
    bait: { spoon: 1.5, minnow: 1.2, crank: 1, jig: .6 }, spots: { ice: 14 }, depth: [4, 20],
    range: 'Northern North America, Europe and Asia.', habitat: 'Weedy edges of cool lakes and rivers.', eats: 'Fish, frogs, even ducklings.',
    fact: 'An ambush hunter with a duck-bill snout full of sharp teeth. It hides in weeds and strikes like lightning.',
    look: { s: 'pike', b: '#3a5a2a', m: '#7a9a5a', u: '#e8ecd8', sp: '#d8e0a0', f: '#a86a3a' } },
  { id: 'laketrout', name: 'Lake Trout', sci: 'Salvelinus namaycush', water: 'fresh', temp: 'cold', adult: 24, big: 38, c: .0004, val: 300, fry: 0, growH: 7, feedH: 4, diet: 'pred', fight: 'digger', time: 'any', rain: 1,
    bait: { jig: 1.4, spoon: 1.2, minnow: 1 }, spots: { ice: 10 }, depth: [22, 40],
    range: 'Canada, Alaska, the Great Lakes and deep lakes of the northern US.', habitat: 'Deep, very cold lakes.', eats: 'Fish, especially ciscoes and smelt.',
    fact: 'Another char, not a true trout. It lives in deep, cold water and can live for decades.',
    look: { s: 'trout', b: '#3a4a4a', m: '#8a9a9a', u: '#eef0f0', sp: '#d8e0e0', f: '#6a7a7a' } },
  { id: 'burbot', name: 'Burbot', sci: 'Lota lota', water: 'fresh', temp: 'cold', adult: 20, big: 30, c: .0003, val: 150, fry: 0, growH: 6, feedH: 4, diet: 'pred', fight: 'digger', time: 'night', rain: 1,
    bait: { minnow: 1.2, cutbait: 1, jig: 1.1 }, spots: { ice: 8 }, depth: [28, 40],
    range: 'Cold lakes and rivers across the far north of the world.', habitat: 'Deep, cold lake bottoms.', eats: 'Fish, crayfish.',
    fact: 'The only freshwater member of the cod family. It spawns under the ice in the middle of winter.',
    look: { s: 'cat', b: '#4a4020', m: '#8a7a4a', u: '#e0d8b8', sp: '#2a2410', f: '#5a5030' } },
  { id: 'algar', name: 'Alligator Gar', sci: 'Atractosteus spatula', water: 'fresh', temp: 'warm', adult: 60, big: 90, c: .00025, val: 900, fry: 0, growH: 12, feedH: 6, diet: 'pred', fight: 'thrasher', time: 'night', rain: 1, legendOnly: true,
    bait: { cutbait: 1, minnow: 1 }, spots: {},
    range: 'Gulf coast rivers, bayous and the lower Mississippi.', habitat: 'Slow rivers, bayous and brackish bays.', eats: 'Fish, crabs, waterbirds.',
    fact: 'One of the biggest freshwater fish in North America. It can grow over 8 feet long, with a broad snout full of teeth like an alligator’s.',
    look: { s: 'gar', b: '#3a3a20', m: '#7a7a50', u: '#d8d8b8', sp: '#1a1a0a', f: '#5a5a30' } }
];
const SP = Object.fromEntries(SPECIES.map(s => [s.id, s]));

const TRAITS = {
  albino: { name: 'Albino', mult: 4, chance: .02, info: 'No dark pigment at all, so the fish is white or pale with pink eyes. It happens in the wild, but rarely.' },
  golden: { name: 'Golden', mult: 6, chance: .015, only: ['rainbow', 'steelhead'], info: 'A real color form of rainbow trout that traces back to a West Virginia hatchery in the 1950s.' },
  melanistic: { name: 'Melanistic', mult: 3, chance: .02, info: 'Extra dark pigment makes the fish nearly black. The opposite of albino.' },
  piebald: { name: 'Piebald', mult: 2.5, chance: .03, info: 'Patches of missing pigment leave white splotches across the body.' },
  spotted: { name: 'Heavy spots', mult: 1.5, chance: .07, info: 'Extra-dense spotting. Collectors pay more for bold patterns.' },
  giant: { name: 'Giant gene', mult: 2.5, chance: .03, info: 'Grows about 40% longer than normal for its kind.' }
};

// ---------- tanks & gear ----------
const TANK_SIZES = [
  { gal: 40, inches: 36, price: 0, name: '40-gallon tank' },
  { gal: 75, inches: 48, price: 2000, name: '75-gallon tank' },
  { gal: 150, inches: 72, price: 6500, name: '150-gallon tank' },
  { gal: 300, inches: 96, price: 18000, name: '300-gallon show tank' }
];
const EXTRA_TANK_PRICE = [0, 1200, 2500];
const FILTERS = [
  { name: 'Sponge filter', eff: .35, life: 20, cart: 8, power: .5, price: 0, info: 'Basic air-driven sponge. Cheap to run, but cleans slowly.' },
  { name: 'Hang-on-back filter', eff: .6, life: 32, cart: 28, power: 1.5, price: 650, info: 'Hangs on the rim. Cleans much better; cartridges cost more.' },
  { name: 'Canister filter', eff: .85, life: 56, cart: 65, power: 3, price: 2400, info: 'Big sealed canister under the tank. Best cleaning, longest-lasting media, highest running cost.' }
];
const HEATER = { price: 350, power: 2.5, max: 84, info: 'Lets you raise the water up to 84°F. Warmwater fish grow fastest at 74–80°F.' };
const CHILLER = { price: 3800, power: 9, min: 46, info: 'Cools water down to 46°F. Trout, char and grayling need it: room temperature (68°F) is too warm for them.' };
const FEEDER = { price: 1500, power: .5, info: 'Feeds each fish automatically when it gets hungry, using the food you pick, even while you are away.' };
const POWER_RATE_NOTE = 'Equipment runs on electricity, billed every hour, even while you are away.';

const FOODS = {
  flakes: { name: 'Flake food', price: 9, qty: 60, info: 'Cheap and fine for small fish under 8 inches. Bigger fish barely notice it.', small: true },
  pellets: { name: 'Sinking pellets', price: 22, qty: 60, info: 'Balanced everyday food every fish will eat.' },
  bloodworms: { name: 'Frozen bloodworms', price: 18, qty: 30, info: 'A treat for bug-eaters and panfish: +25% growth for 2 hours.' },
  nightcrawlers: { name: 'Live nightcrawlers', price: 15, qty: 20, info: 'Trout, bass, catfish and most fish love them: +30% growth for 2 hours.' },
  minnows: { name: 'Feeder minnows', price: 28, qty: 20, info: 'Live fish for predators only: +40% growth for 2 hours. Bug-eaters ignore them.' },
  color: { name: 'Color-boost pellets', price: 45, qty: 40, info: 'Specialty food with natural pigments. Brightens colors: +12% sale value for 6 hours.' },
  meds: { name: 'Medicated flakes', price: 35, qty: 15, info: 'Treats sick fish: +30 health right away.' }
};
// how well each diet takes each food: 0 = refuses
const FOOD_EFF = {
  flakes: { insect: 1, omni: 1, pred: .4, bottom: .8 },
  pellets: { insect: 1, omni: 1, pred: .8, bottom: 1 },
  bloodworms: { insect: 1.25, omni: 1.2, pred: .8, bottom: 1.1 },
  nightcrawlers: { insect: 1.25, omni: 1.3, pred: 1.2, bottom: 1.3 },
  minnows: { insect: 0, omni: 1.1, pred: 1.4, bottom: 1.1 },
  color: { insect: 1, omni: 1, pred: .8, bottom: 1 },
  meds: { insect: 1, omni: 1, pred: .8, bottom: 1 }
};

// style: bobber = wait for the bobber; bottom = watch the rod tip; lure = reel it back yourself; fly = drifts on the surface; jig = ice
const BAITS = {
  worm: { name: 'Nightcrawlers', price: 6, qty: 12, style: 'bobber', info: 'The all-rounder under a bobber. Most fish will take a worm.' },
  cricket: { name: 'Crickets', price: 7, qty: 12, style: 'bobber', info: 'Panfish candy under a bobber. Bluegill and pumpkinseed love them.' },
  minnow: { name: 'Live minnows', price: 12, qty: 12, style: 'bobber', info: 'Live bait under a bobber for predators: bass, walleye, pike, crappie, flatheads.' },
  cutbait: { name: 'Cut bait', price: 9, qty: 12, style: 'bottom', info: 'Chunks of oily fish fished on the bottom. Catfish and saltwater fish follow the scent. Watch the rod tip.' },
  shrimp: { name: 'Shrimp', price: 11, qty: 12, style: 'bottom', info: 'Top saltwater bait, fished on the bottom. Drum and croaker can’t resist it.' },
  spinner: { name: 'Inline spinner', price: 40, lure: 1, style: 'lure', speed: [.35, .65], info: 'Cast and reel it back at a steady medium speed so the blade spins. Trout and bass. Lost if your line snaps.' },
  crank: { name: 'Crankbait', price: 65, lure: 1, style: 'lure', speed: [.55, .9], twitch: 1, info: 'Reel fast so it dives and wobbles; tap to twitch it now and then. Bass and walleye go for it.' },
  spoon: { name: 'Casting spoon', price: 45, lure: 1, style: 'lure', speed: [.2, .5], info: 'Casts a mile. Reel slow so it flutters. Pike, lake trout, steelhead, stripers.' },
  fly: { name: 'Dry fly', price: 30, lure: 1, style: 'fly', info: 'A hand-tied bug that floats and drifts. Watch for a trout rising to it, then set the hook.' },
  jig: { name: 'Ice jig', price: 35, lure: 1, style: 'jig', info: 'A weighted jig you twitch up and down through the ice.' }
};
const STYLES = {
  bobber: 'Bobber: cast, wait for the bobber to dip, then click fast.',
  bottom: 'Bottom fishing: cast, let it sit, and watch the rod tip. Set the hook on a hard double pull, not the little taps.',
  lure: 'Lure: cast, then hold to reel it back. Keep the reel speed in the green zone. Fish strike while it moves.',
  fly: 'Fly: cast and let it drift. When a fish rises and splashes, click right away.',
  jig: 'Jigging: drop to depth, then tap to jig in a slow rhythm.'
};
// structure in the water: casting into it means more bites and bigger fish
const STRUCT = {
  weeds: { name: 'Weed bed', fav: ['largemouth', 'bluegill', 'pumpkinseed', 'pike', 'bowfin', 'crappie'] },
  rocks: { name: 'Rock pile', fav: ['smallmouth', 'perch', 'walleye', 'brook', 'cutthroat'] },
  timber: { name: 'Sunken timber', fav: ['crappie', 'largemouth', 'flathead', 'channel', 'bluecat'] },
  drop: { name: 'Drop-off', fav: ['rainbow', 'brown', 'walleye', 'laketrout', 'steelhead'] },
  pool: { name: 'Plunge pool', fav: ['brook', 'rainbow', 'brown', 'cutthroat', 'grayling'] },
  current: { name: 'Current seam', fav: ['smallmouth', 'steelhead', 'walleye', 'channel', 'carp'] },
  pilings: { name: 'Pilings', fav: ['blackdrum', 'reddrum', 'striper', 'croaker', 'flathead'] },
  bar: { name: 'Sandbar slough', fav: ['reddrum', 'flounder', 'striper'] }
};
const RODS = {
  old: { name: "Gus's old rod", price: 0, line: 8, cast: 18, reel: 1, info: 'Light 8 lb line. Fine for panfish; big fish snap it easily.' },
  spin: { name: 'Spinning combo', price: 900, line: 12, cast: 26, reel: 1.25, info: '12 lb line, longer casts, faster reel.' },
  fly: { name: 'Fly rod', price: 2200, line: 6, cast: 22, reel: 1.1, flyBonus: 1.5, info: 'Light 6 lb line, but flies work 50% better with it. Made for trout and grayling.' },
  bait: { name: 'Baitcaster', price: 2800, line: 20, cast: 30, reel: 1.4, info: '20 lb line and a fast reel for bass and pike.' },
  cat: { name: 'Catfish rod', price: 3500, line: 40, cast: 28, reel: 1.3, info: '40 lb line. Built to haul big catfish off the bottom.' },
  surf: { name: 'Surf rod', price: 5500, line: 30, cast: 45, reel: 1.3, info: '30 lb line and huge casts. Reach the deep water off the pier.' }
};
const WELLS = [
  { name: 'Bait bucket', cap: 1, price: 0, decay: 30, info: 'A bucket of lake water. Holds one fish, and it gets stressed fast.' },
  { name: 'Cooler live well', cap: 2, price: 900, decay: 14, info: 'Insulated cooler with a little pump. Holds 2 fish.' },
  { name: 'Aerated live well', cap: 4, price: 3000, decay: 5, info: 'Built-in aerator keeps 4 fish healthy for hours.' },
  { name: 'Truck-bed tank', cap: 8, price: 9000, decay: 1, cold: true, info: 'Full tank in the truck bed with its own chiller. Holds 8; even trout stay healthy.' }
];

// ---------- spots ----------
const SPOTS = {
  lake: { name: 'Willow Lake', lvl: 1, gas: 0, map: [40, 62], blurb: 'Home. Gus’s cabin, your tanks, Bait & Fry and a calm glacier lake.', weather: [['clear', 5], ['cloudy', 3], ['rain', 2]], buyer: { name: 'Marla at Bait & Fry', wants: ['bluegill', 'perch', 'largemouth', 'crappie', 'pumpkinseed'] } },
  creek: { name: 'Cedar Creek', lvl: 2, gas: 25, map: [22, 22], blurb: 'A cold mountain stream with a waterfall pool. Trout and grayling.', weather: [['clear', 4], ['cloudy', 3], ['rain', 2], ['fog', 1]], buyer: { name: 'Cedar Creek Hatchery', wants: ['brook', 'rainbow', 'cutthroat', 'grayling', 'brown'] } },
  river: { name: 'Big Fork River', lvl: 3, gas: 20, map: [64, 38], blurb: 'A wide river with a covered bridge. Smallmouth, walleye, catfish.', weather: [['clear', 5], ['cloudy', 3], ['rain', 2]], buyer: { name: 'Big Fork Fish Fry', wants: ['channel', 'walleye', 'smallmouth', 'perch', 'crappie', 'bluegill'] } },
  bayou: { name: 'Black Bayou', lvl: 4, gas: 40, map: [74, 80], blurb: 'Cypress swamp and boardwalks. Gar, bowfin and big cats at night.', weather: [['fog', 4], ['clear', 3], ['rain', 3]], buyer: { name: 'Old Lou', wants: ['channel', 'crappie', 'largemouth', 'bluegill', 'carp'] } },
  pier: { name: 'Gull Point Pier', lvl: 5, gas: 60, map: [90, 56], blurb: 'Ocean pier and a lighthouse. Red drum, stripers, flounder.', weather: [['clear', 4], ['cloudy', 3], ['rain', 2], ['fog', 1]], buyer: { name: 'Rosa’s Seafood Shack', wants: ['rainbow', 'brown', 'walleye', 'largemouth', 'channel'] } },
  ice: { name: 'Frostbite Lake', lvl: 6, gas: 80, map: [52, 10], blurb: 'Frozen north. Fish through the ice from inside an igloo.', weather: [['snow', 5], ['clear', 3], ['cloudy', 2]], buyer: { name: 'Frostbite Ice Camp', wants: ['perch', 'walleye', 'brook', 'rainbow', 'cutthroat'] } }
};
const SPOT_ORDER = ['lake', 'creek', 'river', 'bayou', 'pier', 'ice'];

const LEGENDS = {
  lake: { sp: 'rainbow', name: 'The Gilded One', traits: ['golden', 'giant'], size: 1.25, need: { time: ['dawn'], bait: ['spinner', 'fly'], far: 14 }, clue: 'Dawn only. A spinner or a fly. Cast far, out past the drop-off.', val: 9000 },
  creek: { sp: 'brook', name: 'Old Kype', traits: ['giant', 'spotted'], size: 1.2, need: { time: ['dusk'], bait: ['fly'], far: 0 }, clue: 'Dusk, in the waterfall pool, on a fly.', val: 5000 },
  river: { sp: 'flathead', name: 'Ironjaw', traits: ['giant', 'melanistic'], size: 1.2, need: { time: ['night'], bait: ['minnow'], far: 0, rod: 'cat' }, clue: 'Night, live minnow, and a catfish rod. Anything less and he snaps you off.', val: 7000 },
  bayou: { sp: 'algar', name: 'The Swamp King', traits: [], size: 1, need: { time: ['night'], bait: ['cutbait'], far: 0 }, clue: 'An alligator gar the size of a canoe. Night, cut bait, off the end of the boardwalk.', val: 12000 },
  pier: { sp: 'reddrum', name: 'Copperback', traits: ['giant'], size: 1.25, need: { time: ['dawn', 'dusk'], bait: ['shrimp'], far: 30, weather: 'rain' }, clue: 'A bull red that only shows in the rain, at dawn or dusk. Shrimp, cast way out with a surf rod.', val: 8000 },
  ice: { sp: 'laketrout', name: 'The Ghost of Frostbite', traits: ['albino', 'giant'], size: 1.2, need: { time: ['night'], bait: ['jig'], depth: 34 }, clue: 'A white lake trout that hunts at night, deeper than 34 feet. Jig it.', val: 10000 }
};

const PAGES = {
  lake: { title: 'Page 1: Willow Lake', text: "Kid, if you're reading this I finally went after it. The Gilded One. Thirty years I've watched that gold flash at dawn, out past the drop-off. Spinner or a fly. Cast long. I left the rest of my notes wherever I fished. Find 'em." },
  creek: { title: 'Page 2: Cedar Creek', text: "Brookies only live where the water is cold and clean. If they ever vanish from a creek, something upstream is wrong. There's an old one in the falls pool with a hooked jaw. Folks call him Old Kype. Dusk. A fly. Don't rush him." },
  river: { title: 'Page 3: Big Fork River', text: "Under this bridge lives Ironjaw, a flathead so dark he's nearly black. He only eats live fish, and only after dark. Bring a real catfish rod; he's snapped every line I ever put on him." },
  bayou: { title: 'Page 4: Black Bayou', text: "Lou says the Swamp King is older than him. An alligator gar long as a canoe, with armor for scales. Cut bait at night off the end of the boardwalk. Bring a net and a friend." },
  pier: { title: 'Page 5: Gull Point', text: "Rosa told me about Copperback, a bull red the color of a new penny. Only shows when it storms, at first or last light. Shrimp on a surf rod, cast to the horizon." },
  ice: { title: 'Page 6: Frostbite Lake', text: "Up here they talk about a ghost under the ice: a lake trout pale as snow, hunting deep at night. Drop past 34 feet and jig slow. If you've found all my pages, you know everything I know. The Gilded One is yours to catch. I'm proud of you, kid. — Gus" }
};

const NPCS = {
  marla: ['Welcome to Bait & Fry! Fry are baby fish. Raise them up and they sell for a lot more than wild ones; folks pay extra for tank-raised.', 'Trout need cold water. Room temperature is 68°F, too warm for them, so you’ll need a chiller before you raise any.', 'Match your bait to the fish. Crickets for panfish, minnows for bass, flies for trout. Check the Field Guide for what each fish likes.', 'Every spot has a buyer with orders. They pay way over market, but you have to bring the fish in your truck’s live well.'],
  lou: ['Bayou’s best after dark, cher. Cats and gar come up to feed when the frogs start singin’.', 'Gar can breathe air. Seen ’em gulp at the top when the water gets warm and still.', 'Bring me catfish and crappie from your tanks and I’ll pay you right. Fish fry every Friday.'],
  rosa: ['Shrimp catches just about everything out here. Drum love it.', 'Saltwater fish need a saltwater tank. Until you’ve got one, sell ’em or let ’em go.', 'My customers want fresh-water fish too: trout, walleye, bass. Raised ones taste better, they say. Check my order board.'],
  hatch: ['We restock this creek with native fish. Bring us healthy trout from your tanks and we’ll pay well.', 'Grayling only live in very clean, cold water. If you keep them, keep that chiller running.'],
  fry: ['Fresh fish fried every night. Bring me catfish, walleye and panfish from your tanks and I\u2019ll pay well.', 'Smallmouth love the rocks below the bridge. Crankbaits, reeled fast.', 'Catfish bite best after dark, on cut bait sitting on the bottom.'],
  ice: ['Drop your jig with the fish finder on. Perch hang shallow, walleye in the middle, lake trout and burbot down deep.', 'Jig slow and steady. Jerk it too fast and you’ll spook ’em.']
};

// tips shown once, the first time each comes up
const TIPS = {
  start: 'WASD to walk, drag to look around, E to interact. Gus left his cabin, a tank and a truck. Start at the dock or at Bait & Fry.',
  tank: 'This is your tank. Fish need feeding, clean water, a working filter and the right temperature, or they stop growing and get sick. The Care tab explains each thing.',
  feed: 'Each fish eats one portion per feeding. Small fish get hungry every ~2 hours, big ones every 3–4. Feeding a fish that isn’t hungry wastes food and dirties the water.',
  temp: 'This fish needs a different temperature than your tank. Fish outside their range stop growing and slowly get sick.',
  filter: 'Your filter cartridge is wearing out. When it hits 0%, the water gets dirty about three times faster. Replace it in the Care tab.',
  algae: 'Algae is building up on the glass. Pick the scrub tool and drag across the glass to clean it. It’s free, just takes a minute.',
  crowd: 'Your tank is overcrowded. Each fish needs space: roughly 1 gallon per 0.6 inch of fish. Too many fish dirty the water fast and stress everyone.',
  fish: 'Pick a bait below, then hold to charge a cast and release. Wait for the bobber to dip, then click fast to set the hook.',
  reel: 'Hold to reel. Watch the tension bar: if it hits 100% the line snaps. Let go when the fish runs.',
  jump: 'Jumpers leap out of the water. Stop reeling while it’s in the air or it throws the hook.',
  net: 'Big fish need the net. Click when the ring is inside the green circle.',
  ice: 'Hold DROP to let your jig sink. The fish finder shows fish at different depths. Then tap JIG in a slow, steady rhythm. When the rod bends, click to set the hook.',
  truck: 'Your truck takes you to other spots. Gas costs money. Fish you catch away from home ride back in your live well, which holds only so many.',
  order: 'Buyers pay far more than market price, but they want specific fish at a minimum size. Bring them from your tanks in the truck’s live well.',
  well: 'Fish in your truck’s live well slowly lose health. Better live wells keep them healthy longer. Move them into a home tank when you get back.',
  debt: 'You’re in the red. Power bills keep running even when you’re broke. Sell some fish to get back above zero; you can’t buy anything until then.',
  online: 'Join the Anglers board (top right) to see your friends’ catches, species records and who lands the legends first. You also get a cloud save code.',
  legend: 'Every spot has a legendary fish. Gus’s logbook pages hold the clues: the time, bait and place it bites.'
};
