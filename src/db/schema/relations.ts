import { relations } from "drizzle-orm";
import { user } from "./auth";
import { customers, addresses } from "./customers";
import { products, productVariants, stockLedger } from "./inventory";
import { categories, heroSlides, productImages } from "./catalog";
import { couponRedemptions, coupons } from "./discounts";
import { deliveryZones } from "./logistics";
import { orders, orderItems, payments, shipments } from "./orders";
import { purchaseOrders, purchaseOrderItems, vendors } from "./purchasing";
import { returns, returnItems, vendorClaims } from "./returns";

/** Relations power Drizzle's `db.query.*.findMany({ with: … })` API. They don't change the SQL schema. */

export const productsRelations = relations(products, ({ one, many }) => ({
  variants: many(productVariants),
  images: many(productImages),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [productImages.variantId], references: [productVariants.id] }),
}));

export const heroSlidesRelations = relations(heroSlides, ({ one }) => ({
  product: one(products, { fields: [heroSlides.productId], references: [products.id] }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  redemptions: many(couponRedemptions),
}));

export const couponRedemptionsRelations = relations(couponRedemptions, ({ one }) => ({
  coupon: one(coupons, { fields: [couponRedemptions.couponId], references: [coupons.id] }),
  order: one(orders, { fields: [couponRedemptions.orderId], references: [orders.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  ledger: many(stockLedger),
}));

export const stockLedgerRelations = relations(stockLedger, ({ one }) => ({
  variant: one(productVariants, { fields: [stockLedger.variantId], references: [productVariants.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(user, { fields: [customers.userId], references: [user.id] }),
  addresses: many(addresses),
  orders: many(orders),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
  city: one(deliveryZones, { fields: [addresses.cityId], references: [deliveryZones.id] }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  claims: many(vendorClaims),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  vendor: one(vendors, { fields: [purchaseOrders.vendorId], references: [vendors.id] }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.poId], references: [purchaseOrders.id] }),
  variant: one(productVariants, { fields: [purchaseOrderItems.variantId], references: [productVariants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  city: one(deliveryZones, { fields: [orders.cityId], references: [deliveryZones.id] }),
  items: many(orderItems),
  payments: many(payments),
  shipments: many(shipments),
  returns: many(returns),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, { fields: [shipments.orderId], references: [orders.id] }),
}));

export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, { fields: [returns.orderId], references: [orders.id] }),
  items: many(returnItems),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  return: one(returns, { fields: [returnItems.returnId], references: [returns.id] }),
  orderItem: one(orderItems, { fields: [returnItems.orderItemId], references: [orderItems.id] }),
}));

export const vendorClaimsRelations = relations(vendorClaims, ({ one }) => ({
  vendor: one(vendors, { fields: [vendorClaims.vendorId], references: [vendors.id] }),
  returnItem: one(returnItems, { fields: [vendorClaims.returnItemId], references: [returnItems.id] }),
}));
