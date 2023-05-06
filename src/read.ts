import fs from 'fs/promises'
import axios from 'axios'

const API_KEY = process.env.API_KEY

interface Locations {
  order: number
  province: string
  name: string
}

async function load() {
  const content = await fs.readFile('./_debug.csv', 'utf-8')

  const locations: Locations[] = content
    .split('\n')
    .map((line) => line.replace(/\"/g, '').split(','))
    .map(([name, province, order]) => ({
      order: parseInt(order),
      province,
      name,
    }))

  for (let location of locations) {
    try {
      const locationQuery = `${location.name} ${location.province}`
      console.log(`> ${location.name}, ${location.province}`)

      const response = await axios.post(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${locationQuery}&key=${API_KEY}`
      )

      const json = response.data.results?.[0]

      const {lat, lng} = json.geometry.location
      const {name, formatted_address, place_id, business_status} = json

      const fileContent = `"${location.name}","${location.province}","${location.order}","${name}","${formatted_address}","${place_id}","${business_status}","${lat}","${lng}"\n`

      await fs.appendFile('./_locations2.csv', fileContent)
      console.log(`[ok] ${name} ${lat},${lng}`)
    } catch (e) {
      console.warn(`[fail] ${location?.name}`, e)
      await fs.appendFile(
        './_fails.csv',
        `"${location?.name}","${location?.province}","${location?.order}"\n`
      )
      continue
    }
  }
}

load()
