// Placeholder data for dashboard sections whose APIs don't exist yet
// (shipments). Every section using this is labelled
// "Sample data" in the UI. Replace with API calls as those modules land.

export type ShipmentStage =
  | "REQUESTED"
  | "APPROVED"
  | "AWAITING_PAYMENT"
  | "AT_WAREHOUSE"
  | "IN_CONTAINER"
  | "SHIPPED"
  | "AT_PORT"
  | "CLEARING_CUSTOMS"
  | "READY_FOR_PICKUP"
  | "DELIVERED"

export const STAGES: { key: ShipmentStage; label: string; tone: "neutral" | "blue" | "amber" | "green" }[] = [
  { key: "REQUESTED", label: "Requested", tone: "neutral" },
  { key: "APPROVED", label: "Approved", tone: "blue" },
  { key: "AWAITING_PAYMENT", label: "Awaiting payment", tone: "amber" },
  { key: "AT_WAREHOUSE", label: "At warehouse", tone: "blue" },
  { key: "IN_CONTAINER", label: "In container", tone: "blue" },
  { key: "SHIPPED", label: "Shipped", tone: "blue" },
  { key: "AT_PORT", label: "At port", tone: "blue" },
  { key: "CLEARING_CUSTOMS", label: "Clearing customs", tone: "amber" },
  { key: "READY_FOR_PICKUP", label: "Ready for pickup", tone: "green" },
  { key: "DELIVERED", label: "Delivered", tone: "green" },
]

export const SAMPLE = {
  openShipments: 24,
  stageCounts: {
    REQUESTED: 6,
    APPROVED: 4,
    AWAITING_PAYMENT: 7,
    AT_WAREHOUSE: 3,
    IN_CONTAINER: 5,
    SHIPPED: 6,
    AT_PORT: 2,
    CLEARING_CUSTOMS: 3,
    READY_FOR_PICKUP: 4,
    DELIVERED: 112,
  } as Record<ShipmentStage, number>,
  recentRequests: [
    { id: "SR-10491", customer: "Kojo Antwi", product: "Honda CR-V 2017", stage: "REQUESTED", cost: "GHS 74,000" },
    { id: "SR-10488", customer: "Abena Owusu", product: "20 kVA generator", stage: "AWAITING_PAYMENT", cost: "GHS 38,500" },
    { id: "SR-10485", customer: "Yaw Darko", product: "Hyundai Elantra 2019", stage: "APPROVED", cost: "GHS 69,200" },
    { id: "SR-10482", customer: "Kwame Asante", product: "Toyota Corolla 2018", stage: "CLEARING_CUSTOMS", cost: "GHS 86,500" },
    { id: "SR-10477", customer: "Efua Mensah", product: "Ceramic floor tiles (40 ft)", stage: "SHIPPED", cost: "GHS 121,000" },
  ] as { id: string; customer: string; product: string; stage: ShipmentStage; cost: string }[],
}
