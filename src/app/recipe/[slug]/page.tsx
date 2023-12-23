export default async function Page({params}: {params: {slug: string}}) {
  return <p>Post: {params.slug}</p>
}
