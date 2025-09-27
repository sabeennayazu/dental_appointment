export default function Footer() {
  return (
    <footer className="bg-white shadow-inner py-4 text-center text-gray-500 mt-10">
      <p>© 2025 DentalCare. All rights reserved.</p>
      <div className="mt-2 space-x-4">
        <a href="/privacy" className="hover:text-blue-600">Privacy Policy</a>
        <a href="/terms" className="hover:text-blue-600">Terms</a>
        <a href="/contact" className="hover:text-blue-600">Contact</a>
      </div>
    </footer>
  );
}
