import React from 'react';

import { Link, useLocation } from 'react-router-dom';

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-6xl text-stone-500 italic dark:text-stone-300 mb-12 mt-8">
        <div className="mb-3">
          <span className="italic">Smart</span>&nbsp;
          <span className="font-semibold border-b border-dashed border-gray-500">
            Reconciliation
          </span>
        </div>
        <div>
          &amp;&nbsp;
          <span className="font-semibold border-b border-dashed border-gray-500">
            Anomaly
          </span>
          &nbsp;
          <span className="italic">Detection</span>
        </div>
      </h1>
      <p className="text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto mt-4">
        Fast track your reconcilation effortlessly with a few clicks. Upload CSV
        or Excel files and get instant results. Our intelligent processing
        system handles your data with care and precision.
      </p>
      <button
        type="button"
        className="text-gray-900 italic bg-[#F7BE38] hover:bg-[#F7BE38]/90 focus:ring-4 focus:outline-none focus:ring-[#F7BE38]/50 font-medium rounded-lg text-xl px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#F7BE38]/50 me-2 m-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-mouse-pointer-click"
        >
          <path d="M14 4.1 12 6" />
          <path d="m5.1 8-2.9-.8" />
          <path d="m6 12-1.9 2" />
          <path d="M7.2 2.2 8 5.1" />
          <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
        </svg>
        <Link
          key="/upload"
          to="/upload"
          className="group flex items-center px-2 py-2 text-base font-medium rounded-md"
        >
          &nbsp;Try now&nbsp;
        </Link>
      </button>
      <img
        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80"
        alt="Data Analysis"
        className="mt-4 rounded-lg shadow-xl mx-auto"
      />
    </div>
  );
}
