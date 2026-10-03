/** Words shoppers see for order states (spec §4.7). */
export const FULFILLMENT_LABEL: Record<string, string> = {
  NEW: "Order received",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  BOOKED: "Handed to the courier",
  IN_TRANSIT: "On the way",
  DELIVERED: "Delivered",
  RETURNED_TO_ORIGIN: "Returned to us",
  CANCELLED: "Cancelled",
};

export const PAYMENT_LABEL: Record<string, string> = {
  UNPAID: "Waiting for your payment",
  PENDING_VERIFICATION: "Payment being checked",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partly refunded",
  COD_PENDING: "Pay cash on delivery",
  COD_COLLECTED: "Paid in cash",
  COD_REMITTED: "Paid in cash",
};
