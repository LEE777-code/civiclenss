export const indianStates = [
  { value: "andhra-pradesh", label: "Andhra Pradesh" },
  { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
  { value: "assam", label: "Assam" },
  { value: "bihar", label: "Bihar" },
  { value: "chhattisgarh", label: "Chhattisgarh" },
  { value: "goa", label: "Goa" },
  { value: "gujarat", label: "Gujarat" },
  { value: "haryana", label: "Haryana" },
  { value: "himachal-pradesh", label: "Himachal Pradesh" },
  { value: "jharkhand", label: "Jharkhand" },
  { value: "karnataka", label: "Karnataka" },
  { value: "kerala", label: "Kerala" },
  { value: "madhya-pradesh", label: "Madhya Pradesh" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "manipur", label: "Manipur" },
  { value: "meghalaya", label: "Meghalaya" },
  { value: "mizoram", label: "Mizoram" },
  { value: "nagaland", label: "Nagaland" },
  { value: "odisha", label: "Odisha" },
  { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "sikkim", label: "Sikkim" },
  { value: "tamil-nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "tripura", label: "Tripura" },
  { value: "uttar-pradesh", label: "Uttar Pradesh" },
  { value: "uttarakhand", label: "Uttarakhand" },
  { value: "west-bengal", label: "West Bengal" },
];

export const unionTerritories = [
  { value: "andaman-nicobar", label: "Andaman and Nicobar Islands" },
  { value: "chandigarh", label: "Chandigarh" },
  { value: "dadra-nagar-haveli", label: "Dadra and Nagar Haveli and Daman and Diu" },
  { value: "delhi", label: "Delhi" },
  { value: "jammu-kashmir", label: "Jammu and Kashmir" },
  { value: "ladakh", label: "Ladakh" },
  { value: "lakshadweep", label: "Lakshadweep" },
  { value: "puducherry", label: "Puducherry" },
];

export const allStatesAndUTs = [...indianStates, ...unionTerritories];

export const districtsByState: Record<string, { value: string; label: string }[]> = {
  "tamil-nadu": [
    { value: "chennai", label: "Chennai" },
    { value: "coimbatore", label: "Coimbatore" },
    { value: "madurai", label: "Madurai" },
    { value: "tiruchirappalli", label: "Tiruchirappalli" },
    { value: "salem", label: "Salem" },
    { value: "tirunelveli", label: "Tirunelveli" },
    { value: "erode", label: "Erode" },
    { value: "vellore", label: "Vellore" },
  ],
  "maharashtra": [
    { value: "mumbai", label: "Mumbai" },
    { value: "pune", label: "Pune" },
    { value: "nagpur", label: "Nagpur" },
    { value: "thane", label: "Thane" },
    { value: "nashik", label: "Nashik" },
    { value: "aurangabad", label: "Aurangabad" },
    { value: "solapur", label: "Solapur" },
    { value: "kolhapur", label: "Kolhapur" },
  ],
  "karnataka": [
    { value: "bengaluru", label: "Bengaluru" },
    { value: "mysuru", label: "Mysuru" },
    { value: "hubli-dharwad", label: "Hubli-Dharwad" },
    { value: "mangaluru", label: "Mangaluru" },
    { value: "belgaum", label: "Belgaum" },
    { value: "gulbarga", label: "Gulbarga" },
  ],
  "delhi": [
    { value: "central-delhi", label: "Central Delhi" },
    { value: "east-delhi", label: "East Delhi" },
    { value: "new-delhi", label: "New Delhi" },
    { value: "north-delhi", label: "North Delhi" },
    { value: "south-delhi", label: "South Delhi" },
    { value: "west-delhi", label: "West Delhi" },
  ],
  "kerala": [
    { value: "thiruvananthapuram", label: "Thiruvananthapuram" },
    { value: "kochi", label: "Kochi" },
    { value: "kozhikode", label: "Kozhikode" },
    { value: "thrissur", label: "Thrissur" },
    { value: "kollam", label: "Kollam" },
  ],
  "gujarat": [
    { value: "ahmedabad", label: "Ahmedabad" },
    { value: "surat", label: "Surat" },
    { value: "vadodara", label: "Vadodara" },
    { value: "rajkot", label: "Rajkot" },
    { value: "bhavnagar", label: "Bhavnagar" },
  ],
  "uttar-pradesh": [
    { value: "lucknow", label: "Lucknow" },
    { value: "kanpur", label: "Kanpur" },
    { value: "agra", label: "Agra" },
    { value: "varanasi", label: "Varanasi" },
    { value: "prayagraj", label: "Prayagraj" },
    { value: "noida", label: "Gautam Buddha Nagar (Noida)" },
  ],
  "west-bengal": [
    { value: "kolkata", label: "Kolkata" },
    { value: "howrah", label: "Howrah" },
    { value: "durgapur", label: "Durgapur" },
    { value: "siliguri", label: "Siliguri" },
  ],
  "rajasthan": [
    { value: "jaipur", label: "Jaipur" },
    { value: "jodhpur", label: "Jodhpur" },
    { value: "udaipur", label: "Udaipur" },
    { value: "kota", label: "Kota" },
    { value: "ajmer", label: "Ajmer" },
  ],
};

// Default districts for states not explicitly defined
const defaultDistricts = [
  { value: "district-1", label: "District 1" },
  { value: "district-2", label: "District 2" },
  { value: "district-3", label: "District 3" },
];

export const getDistrictsForState = (stateValue: string): { value: string; label: string }[] => {
  return districtsByState[stateValue] || defaultDistricts;
};

export const localBodies = [
  { value: "municipal-corporation", label: "Municipal Corporation" },
  { value: "municipality", label: "Municipality" },
  { value: "town-panchayat", label: "Town Panchayat" },
  { value: "village-panchayat", label: "Village Panchayat" },
  { value: "cantonment-board", label: "Cantonment Board" },
  { value: "notified-area-council", label: "Notified Area Council" },
];

export type AdminRole = "state" | "district" | "local";

export const adminRoles = [
  { value: "state", label: "State Admin", description: "Manage all issues within the state" },
  { value: "district", label: "District Admin", description: "Manage issues within a specific district" },
  { value: "local", label: "Local Body Admin", description: "Manage issues for a local body" },
];
