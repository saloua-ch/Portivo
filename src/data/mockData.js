// Remove or set containers to an empty array
export const containers = [];

export const historicalShipments = [
  { client: "CONSOL CLUB", supplier: "Shenzhen Goods Co.", container: "MSCU7654321", reference: "REF-001", date: "2026-06-14", year: 2026 },
  { client: "CONSOL CLUB", supplier: "Pearl River Trading", container: "CMAU0011223", reference: "REF-010", date: "2026-03-05", year: 2026 },
  { client: "CONSOL CLUB", supplier: "HK Supplies Ltd.", container: "HLXU5544332", reference: "REF-022", date: "2025-11-18", year: 2025 },
  { client: "FashionTN", supplier: "Milano Textiles", container: "CMAU1234567", reference: "REF-003", date: "2026-06-12", year: 2026 },
  { client: "GroceryTN", supplier: "Valencia Foods SA", container: "EGLV3210987", reference: "REF-006", date: "2026-06-16", year: 2026 },
];

export const analyticsData = {
  totalContainers: 148,
  activeContainers: 12,
  deliveredThisMonth: 9,
  avgTransitDays: 18,
  monthlyVolume: [
    { month: "Jan", count: 10 },
    { month: "Feb", count: 14 },
    { month: "Mar", count: 9 },
    { month: "Apr", count: 17 },
    { month: "May", count: 21 },
    { month: "Jun", count: 12 },
  ],
  topClients: [
    { name: "GroceryTN", shipments: 34 },
    { name: "CONSOL CLUB", shipments: 28 },
    { name: "FashionTN", shipments: 19 },
    { name: "AutoZone TN", shipments: 15 },
    { name: "IndustrialTN", shipments: 11 },
  ],
};