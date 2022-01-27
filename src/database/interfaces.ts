
// data

export interface Treasure {
  id?: string,
  location: string,
  geohash: string,
  name: string,
  description?: string,
  image?: string,
  minted: boolean,
  owner?: string
}
