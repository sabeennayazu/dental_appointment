"use client";

const dentists = [
  {
    id: 1,
    name: "Dr. Maya Shrestha",
    title: "Cosmetic Dentist",
    location: "Kathmandu",
    price: "From NPR 2,500",
    rating: 4.9,
    img: "/file.svg",
  },
  {
    id: 2,
    name: "Dr. Ramesh Adhikari",
    title: "Orthodontist",
    location: "Pokhara",
    price: "From NPR 3,000",
    rating: 4.8,
    img: "/globe.svg",
  },
  {
    id: 3,
    name: "Dr. Sunita Koirala",
    title: "Pediatric Dentist",
    location: "Lalitpur",
    price: "From NPR 1,800",
    rating: 4.7,
    img: "/next.svg",
  },
  {
    id: 4,
    name: "Dr. Arjun Thapa",
    title: "Oral Surgeon",
    location: "Butwal",
    price: "From NPR 4,500",
    rating: 4.6,
    img: "/window.svg",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto py-6 my-4 bg-white">
      {/* Hero */}
      <section className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-blue-200 rounded-2xl border-white p-8 md:p-16 shadow-lg">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 leading-tight">
            Book trusted dental care across Nepal
          </h1>
          <p className="mt-4 text-gray-700 text-lg">
            Find dentists, read reviews, and book appointments in minutes. Gentle care,
            modern clinics, and clear prices — all in one place.
          </p>

          <form className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              aria-label="search services"
              placeholder="Search e.g. 'cosmetic', 'orthodontist'"
              className="px-4 py-3 rounded-lg border border-gray-200 shadow-sm"
            />
            <input
              aria-label="location"
              placeholder="City or Location"
              className="px-4 py-3 rounded-lg border border-gray-200 shadow-sm"
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 pb-1.5 bg-[#F8EDE3] rounded-full shadow">No walk-ins</span>
            <span className="px-3 py-1 pb-1.5 bg-[#F8EDE3] rounded-full shadow">Verified clinics</span>
            <span className="px-3 py-1 pb-1.5  bg-[#F8EDE3] rounded-full shadow">Secure payments</span>
          </div>
        </div>

        <div className="hidden md:flex justify-center">
          <div className="w-72 h-72 bg-white rounded-xl shadow-lg flex items-center justify-center">
            <img src="/vercel.svg" alt="dental illustration" className="w-40 h-40 opacity-90" />
          </div>
        </div>
      </section>

      {/* Featured Dentists */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Top Rated Dentists</h2>
          <a href="/appointments" className="text-blue-600 hover:underline">
            View all
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          {dentists.map((d) => (
            <article key={d.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center">
                  <img src={d.img} alt={d.name} className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-semibold">{d.name}</h3>
                  <p className="text-sm text-gray-500">{d.title}</p>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>{d.location} · <span className="text-black font-medium">{d.price}</span></p>
                <p className="mt-2">⭐ {d.rating} · <span className="text-blue-600">Book now</span></p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12 bg-gray-50 p-6 rounded-xl">
        <h2 className="text-xl font-bold">How it works</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="font-semibold">1. Search</h4>
            <p className="text-sm text-gray-600 mt-2">Find the service or dentist you need.</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="font-semibold">2. Book</h4>
            <p className="text-sm text-gray-600 mt-2">Choose an available slot and confirm.</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="font-semibold">3. Visit</h4>
            <p className="text-sm text-gray-600 mt-2">Get treated by licensed professionals.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-12">
        <h2 className="text-xl font-bold">What patients say</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <blockquote className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-700">“Friendly staff, painless filling, and quick booking.”</p>
            <cite className="block mt-3 text-sm text-gray-500">— Sita, Kathmandu</cite>
          </blockquote>
          <blockquote className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-700">“My child's first visit was great — very patient and kind.”</p>
            <cite className="block mt-3 text-sm text-gray-500">— Rohan, Pokhara</cite>
          </blockquote>
          <blockquote className="p-4 bg-white rounded-lg shadow">
            <p className="text-gray-700">“Transparent pricing and professional care.”</p>
            <cite className="block mt-3 text-sm text-gray-500">— Anju, Lalitpur</cite>
          </blockquote>
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
}
