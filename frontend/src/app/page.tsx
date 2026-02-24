import { getHome } from "@/lib/api"


export default async function Home() {
  const home = await getHome();

  return (
    <h1>{home.message}</h1>
  )
}
