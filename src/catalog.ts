export type Title = {
  id: number;
  name: string;
  year: number;
  kind: "movie" | "tv";
  genre: string;
  description: string;
  poster: string;
  backdrop?: string;
};
const img = "https://media.themoviedb.org/t/p/";
export const catalog: Title[] = [
  {
    id: 693134,
    name: "Dune: Part Two",
    year: 2024,
    kind: "movie",
    genre: "Science fiction",
    description:
      "Paul Atreides joins the Fremen on a journey of revenge, caught between the love of his life and the fate of the universe.",
    poster: img + "w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
    backdrop:
      img + "w1920_and_h800_multi_faces/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
  },
  {
    id: 157336,
    name: "Interstellar",
    year: 2014,
    kind: "movie",
    genre: "Science fiction",
    description:
      "A team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.",
    poster: img + "w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
  },
  {
    id: 329865,
    name: "Arrival",
    year: 2016,
    kind: "movie",
    genre: "Science fiction",
    description:
      "A linguist is recruited to communicate with mysterious visitors when spacecraft arrive around the world.",
    poster: img + "w500/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg",
  },
  {
    id: 27205,
    name: "Inception",
    year: 2010,
    kind: "movie",
    genre: "Thriller",
    description:
      "A thief who steals secrets from dreams is offered a chance at redemption: plant an idea instead.",
    poster: img + "w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
  },
  {
    id: 1399,
    name: "Game of Thrones",
    year: 2011,
    kind: "tv",
    genre: "Fantasy",
    description:
      "Great houses vie for power across the Seven Kingdoms while an ancient threat returns.",
    poster: img + "w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
  },
  {
    id: 1396,
    name: "Breaking Bad",
    year: 2008,
    kind: "tv",
    genre: "Drama",
    description:
      "A chemistry teacher enters a dangerous new world, setting off a chain of choices with devastating consequences.",
    poster: img + "w500/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg",
  },
  {
    id: 872585,
    name: "Oppenheimer",
    year: 2023,
    kind: "movie",
    genre: "Drama",
    description:
      "The story of J. Robert Oppenheimer and the Manhattan Project.",
    poster: img + "w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
  },
  {
    id: 615457,
    name: "Nobody",
    year: 2021,
    kind: "movie",
    genre: "Action",
    description:
      "An underestimated father reveals a very different side of himself after a home invasion.",
    poster: img + "w500/oBgWY00bEFeZ9N25wWVyuQddbAo.jpg",
  },
];
