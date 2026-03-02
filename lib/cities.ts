// Static cities data - works without backend
export const CITIES = [
  {
    id: "coimbatore",
    name: "Coimbatore",
    state: "Tamil Nadu",
    wards: ["Ward 1 - Town Hall", "Ward 2 - RS Puram", "Ward 3 - Gandhipuram", "Ward 4 - Peelamedu", "Ward 5 - Saibaba Colony", "Ward 6 - Singanallur", "Ward 7 - Ukkadam", "Ward 8 - Kovaipudur", "Ward 9 - Brookefields", "Ward 10 - Hopes College"],
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    wards: ["Ward 1 - Royapuram", "Ward 2 - Tondiarpet", "Ward 3 - Anna Nagar", "Ward 4 - T Nagar", "Ward 5 - Adyar", "Ward 6 - Velachery", "Ward 7 - Tambaram", "Ward 8 - Ambattur"],
  },
  {
    id: "bangalore",
    name: "Bangalore",
    state: "Karnataka",
    wards: ["Ward 1 - Indiranagar", "Ward 2 - Koramangala", "Ward 3 - Whitefield", "Ward 4 - Jayanagar", "Ward 5 - Rajajinagar", "Ward 6 - Hebbal", "Ward 7 - Electronic City", "Ward 8 - Marathahalli"],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    wards: ["Ward A - Colaba", "Ward B - Dadar", "Ward C - Bandra", "Ward D - Andheri", "Ward E - Borivali", "Ward F - Thane"],
  },
  {
    id: "delhi",
    name: "Delhi",
    state: "Delhi",
    wards: ["Ward 1 - Connaught Place", "Ward 2 - Karol Bagh", "Ward 3 - Dwarka", "Ward 4 - Rohini", "Ward 5 - Saket", "Ward 6 - Lajpat Nagar"],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    wards: ["Ward 1 - Banjara Hills", "Ward 2 - Jubilee Hills", "Ward 3 - Madhapur", "Ward 4 - Secunderabad", "Ward 5 - LB Nagar"],
  },
];

export type City = typeof CITIES[0];

// Try backend first, fall back to static
export async function getCities(apiGet: (url: string) => Promise<{ data: City[] }>): Promise<City[]> {
  try {
    const res = await apiGet("/api/cities/");
    if (res.data && res.data.length > 0) return res.data;
    return CITIES;
  } catch {
    return CITIES;
  }
}
